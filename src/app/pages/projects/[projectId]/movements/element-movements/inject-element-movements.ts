import { computed, DestroyRef, inject, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldTree } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';

import { distinctUntilChanged, map, Observable } from 'rxjs';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	MOVEMENTS_LIST_DEFAULTS,
	MOVEMENTS_LIST_QUERY_SCHEMA,
	MOVEMENTS_LIST_SORT_FIELDS,
	MovementsListSearch,
	MovementsListSearchModel,
	toMovementsListSearchParams,
} from '@pages/projects/[projectId]/movements/movements-list/movements-list.search';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { injectSearchQuery, SearchQuery } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageEventModel } from '@shared/models/model/page-event.model';

export interface ElementMovementsSource<E> {
	idParam: string;
	page: Signal<PageModel<MovementModel> | undefined>;
	pageError: Signal<NotificationModel | undefined>;
	pageLoading: Signal<boolean>;
	pageSilentLoading: Signal<boolean>;
	appliedFilters: () => unknown[];
	fetchElement: (id: string) => Observable<E>;
	fetchDetails: (id: string) => void;
	reloadDetails: (id: string) => void;
	fetchPage: (id: string, page: number | undefined, size: number | undefined) => void;
	reloadPage: (id: string) => void;
	inputSearch: (search: MovementsListSearch) => void;
	titleOf: (element: E) => string;
}

export interface ElementMovements<E> {
	element: Signal<E | undefined>;
	title: Signal<string | undefined>;
	page: Signal<PageModel<MovementModel> | undefined>;
	pageError: Signal<NotificationModel | undefined>;
	pageLoading: Signal<boolean>;
	pageSilentLoading: Signal<boolean>;
	activeFilters: Signal<number>;
	form: FieldTree<MovementsListSearchModel>;
	resetFilters: () => void;
	loadBatch: (event: PageEventModel) => void;
	retryDetails: () => void;
}

interface Context<E> {
	source: ElementMovementsSource<E>;
	id: () => string;
	model: WritableSignal<MovementsListSearchModel>;
	destroyRef: DestroyRef;
}

/**
 * Objectif: Logique commune des pages listant les mouvements d'un élément (activité, véhicule, participant).
 * Périmètre: Charge l'élément et ses détails à chaque changement de son identifiant de route, relie la recherche des
 * mouvements à l'URL, recharge la liste et les détails après une commande sur un mouvement, et charge le lot suivant.
 * Limites: Doit être appelée dans un contexte d'injection, une fois la facade de l'élément injectée ; la source porte
 * les appels propres à chaque élément.
 */
export function injectElementMovements<E>(source: ElementMovementsSource<E>): ElementMovements<E> {
	const route = inject(ActivatedRoute);
	const context: Context<E> = {
		source,
		id: () => route.snapshot.params[source.idParam],
		model: signal(MOVEMENTS_LIST_DEFAULTS),
		destroyRef: inject(DestroyRef),
	};
	const element: WritableSignal<E | undefined> = signal(undefined);
	const searchQuery = searchQueryOf(context);
	route.paramMap
		.pipe(
			map((params) => params.get(source.idParam)),
			distinctUntilChanged(),
			takeUntilDestroyed(context.destroyRef),
		)
		.subscribe(() => load(context, element));
	reloadOnMovementCommands(context);
	return viewOf(context, element, searchQuery);
}

function searchQueryOf<E>(context: Context<E>): SearchQuery<MovementsListSearchModel> {
	const searchQuery: SearchQuery<MovementsListSearchModel> = injectSearchQuery({
		schema: MOVEMENTS_LIST_QUERY_SCHEMA,
		defaults: MOVEMENTS_LIST_DEFAULTS,
		model: context.model,
		extra: sortQueryCodec<MovementsListSearchModel>(MOVEMENTS_LIST_SORT_FIELDS),
		search: (model) => search(context, searchQuery, model),
		apply: (model, initial) => {
			context.source.inputSearch(toMovementsListSearchParams(model));
			if (!initial) context.source.fetchPage(context.id(), undefined, undefined);
		},
	});
	return searchQuery;
}

function search<E>(
	context: Context<E>,
	searchQuery: SearchQuery<MovementsListSearchModel>,
	model: MovementsListSearchModel,
): void {
	context.source.inputSearch(toMovementsListSearchParams(model));
	context.source.fetchPage(context.id(), 0, undefined);
	searchQuery.write(model);
}

function load<E>(context: Context<E>, element: WritableSignal<E | undefined>): void {
	const id = context.id();
	context.source
		.fetchElement(id)
		.pipe(takeUntilDestroyed(context.destroyRef))
		.subscribe((loaded) => element.set(loaded));
	context.source.fetchDetails(id);
	context.source.fetchPage(id, undefined, undefined);
}

function reloadOnMovementCommands<E>(context: Context<E>): void {
	const movementFacade = inject(MovementFacade);
	movementFacade
		.handleMovementFirstPageReload()
		.pipe(takeUntilDestroyed(context.destroyRef))
		.subscribe(() => {
			context.source.fetchPage(context.id(), 0, undefined);
			context.source.reloadDetails(context.id());
		});
	movementFacade
		.handleMovementCurrentPageReload()
		.pipe(takeUntilDestroyed(context.destroyRef))
		.subscribe(() => {
			context.source.reloadPage(context.id());
			context.source.reloadDetails(context.id());
		});
}

function viewOf<E>(
	context: Context<E>,
	element: WritableSignal<E | undefined>,
	searchQuery: SearchQuery<MovementsListSearchModel>,
): ElementMovements<E> {
	const { source } = context;
	return {
		element,
		title: computed(() => titleOf(source, element())),
		page: source.page,
		pageError: source.pageError,
		pageLoading: source.pageLoading,
		pageSilentLoading: source.pageSilentLoading,
		activeFilters: computed(() => source.appliedFilters().filter((value) => value !== undefined).length),
		form: createSearchForm(context.model),
		resetFilters: () => {
			context.model.set(MOVEMENTS_LIST_DEFAULTS);
			search(context, searchQuery, MOVEMENTS_LIST_DEFAULTS);
		},
		loadBatch: (event) => source.fetchPage(context.id(), event.page, event.size),
		retryDetails: () => source.fetchDetails(context.id()),
	};
}

function titleOf<E>(source: ElementMovementsSource<E>, element: E | undefined): string | undefined {
	return element === undefined ? undefined : source.titleOf(element);
}
