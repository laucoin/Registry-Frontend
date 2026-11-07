import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';
import { distinctUntilChanged, map, tap } from 'rxjs';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import {
	PARTICIPANT_MOVEMENTS_LIST_SORT_FIELDS,
	ParticipantMovementsListSearchModel,
	toParticipantMovementsListSearchModel,
	toParticipantMovementsListSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.search';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { PresenceTimelineComponent } from '@shared/ui/common/presence-timeline/presence-timeline.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';

import '@sgdf/ui/button';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/icon';
import '@sgdf/ui/list-item';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';
import '@sgdf/ui/skeleton';

const PARTICIPANT_MOVEMENTS_LIST_DEFAULTS = toParticipantMovementsListSearchModel({
	type: undefined,
	from: undefined,
	to: undefined,
	isVisible: undefined,
	sort: undefined,
});
const PARTICIPANT_MOVEMENTS_LIST_QUERY_SCHEMA: SearchQuerySchema<ParticipantMovementsListSearchModel> = {
	type: 'text',
	from: 'date',
	to: 'date',
	isVisible: 'choice',
};

/**
 * Purpose: Page listant les mouvements d'un participant avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des participants, possède le formulaire de recherche, affiche le nom du participant et ses frises prévue et réelle, et recharge quand un mouvement change.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-participant-movements-list',
	imports: [
		SortFieldsComponent,
		IfProjectAuthorityDirective,
		ListComponent,
		PresenceTimelineComponent,
		MovementElementComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		BooleanChoicePipe,
		TranslocoPipe,
		FormField,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participant-movements-list.page.html',
})
export class ParticipantMovementsListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_RESTORE;

	private readonly destroyRef = inject(DestroyRef);
	protected readonly facade = inject(ParticipantFacade);
	protected readonly movementFacade = inject(MovementFacade);
	protected readonly session = inject(SessionFacade);
	private readonly route = inject(ActivatedRoute);

	protected readonly entity: WritableSignal<ParticipantModel | undefined> = signal(undefined);
	protected readonly entityLoading = signal(false);

	protected readonly title = computed(() => this.buildTitle());

	protected readonly activeFilters = computed(
		() =>
			[
				this.facade.participantMovementsPageTypeParam() !== undefined,
				this.facade.participantMovementsPageFromParam() !== undefined,
				this.facade.participantMovementsPageToParam() !== undefined,
				this.facade.participantMovementsPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = PARTICIPANT_MOVEMENTS_LIST_SORT_FIELDS;
	protected readonly model = signal(PARTICIPANT_MOVEMENTS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: PARTICIPANT_MOVEMENTS_LIST_QUERY_SCHEMA,
		defaults: PARTICIPANT_MOVEMENTS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<ParticipantMovementsListSearchModel>(PARTICIPANT_MOVEMENTS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model, initial) => {
			this.inputSearch(model);
			if (!initial) {
				this.facade.fetchParticipantMovementsPage(this.id(), undefined, undefined);
			}
		},
	});

	constructor() {
		this.route.paramMap
			.pipe(
				map((params) => params.get('participantId')),
				distinctUntilChanged(),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.loadData());
		this.handleMovementActions();
	}

	protected loadData(): void {
		this.facade
			.fetchParticipant(this.id())
			.pipe(withLoading(this.entityLoading))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((entity) => this.entity.set(entity));
		this.facade.fetchParticipantTimeline(this.id());
		this.facade.fetchParticipantMovementsPage(this.id(), undefined, undefined);
	}

	private handleMovementActions(): void {
		this.movementFacade
			.handleMovementFirstPageReload()
			.pipe(
				tap(() => this.facade.fetchParticipantMovementsPage(this.id(), 0, undefined)),
				tap(() => this.facade.reloadParticipantTimeline(this.id())),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
		this.movementFacade
			.handleMovementCurrentPageReload()
			.pipe(
				tap(() => this.facade.reloadParticipantMovementsPage(this.id())),
				tap(() => this.facade.reloadParticipantTimeline(this.id())),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	protected search(model: ParticipantMovementsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchParticipantMovementsPage(this.id(), 0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(PARTICIPANT_MOVEMENTS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: ParticipantMovementsListSearchModel): void {
		const search = toParticipantMovementsListSearchParams(model);
		this.facade.inputMovementsPageSearchParameters(
			search.type,
			search.from,
			search.to,
			search.isVisible,
			search.sort,
		);
	}

	protected retryTimeline(): void {
		this.facade.fetchParticipantTimeline(this.id());
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchParticipantMovementsPage(this.id(), pageEvent.page, pageEvent.size);
	}

	private id(): string {
		return this.route.snapshot.params['participantId'];
	}

	private buildTitle(): string {
		const entity: ParticipantModel | undefined = this.entity();
		return entity ? [entity.firstName, entity.lastName?.toUpperCase()].filter(Boolean).join(' ') : '';
	}
}
