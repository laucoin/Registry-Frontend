import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';
import { distinctUntilChanged, map, tap } from 'rxjs';

import {
	ACTIVITY_MOVEMENTS_LIST_SORT_FIELDS,
	ActivityMovementsListSearchModel,
	toActivityMovementsListSearchModel,
	toActivityMovementsListSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.search';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { DurationHelper } from '@shared/helpers/duration.helper';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ActivityModel } from '@shared/models/model/activity.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';

import '@sgdf/ui/button';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/format-duration';
import '@sgdf/ui/format-number';
import '@sgdf/ui/icon';
import '@sgdf/ui/list-item';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/stat';

const ACTIVITY_MOVEMENTS_LIST_DEFAULTS = toActivityMovementsListSearchModel({
	type: undefined,
	from: undefined,
	to: undefined,
	isVisible: undefined,
	sort: undefined,
});
const ACTIVITY_MOVEMENTS_LIST_QUERY_SCHEMA: SearchQuerySchema<ActivityMovementsListSearchModel> = {
	type: 'text',
	from: 'date',
	to: 'date',
	isVisible: 'choice',
};

/**
 * Purpose: Page listant les mouvements d'une activité avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des activités, possède le formulaire de recherche, affiche le nom de l'activité et ses statistiques (participation, temps en sortie et heures homme), et recharge quand un mouvement change.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-activity-movements-list',
	imports: [
		SortFieldsComponent,
		IfProjectAuthorityDirective,
		ListComponent,
		SectionErrorComponent,
		MovementElementComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		BooleanChoicePipe,
		TranslocoPipe,
		FormField,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './activity-movements-list.page.html',
})
export class ActivityMovementsListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_RESTORE;

	private readonly destroyRef = inject(DestroyRef);
	protected readonly facade = inject(ActivityFacade);
	protected readonly movementFacade = inject(MovementFacade);
	private readonly route = inject(ActivatedRoute);

	protected readonly entity: WritableSignal<ActivityModel | undefined> = signal(undefined);
	protected readonly entityLoading = signal(false);

	protected readonly title = computed(() => this.buildTitle());

	protected readonly movementDuration = computed(() => this.buildMovementDuration());

	protected readonly manDuration = computed(() => this.buildManDuration());

	protected readonly activeFilters = computed(
		() =>
			[
				this.facade.activityMovementsPageTypeParam() !== undefined,
				this.facade.activityMovementsPageFromParam() !== undefined,
				this.facade.activityMovementsPageToParam() !== undefined,
				this.facade.activityMovementsPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = ACTIVITY_MOVEMENTS_LIST_SORT_FIELDS;
	protected readonly model = signal(ACTIVITY_MOVEMENTS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: ACTIVITY_MOVEMENTS_LIST_QUERY_SCHEMA,
		defaults: ACTIVITY_MOVEMENTS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<ActivityMovementsListSearchModel>(ACTIVITY_MOVEMENTS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model, initial) => {
			this.inputSearch(model);
			if (!initial) {
				this.facade.fetchActivityMovementsPage(this.id(), undefined, undefined);
			}
		},
	});

	constructor() {
		this.route.paramMap
			.pipe(
				map((params) => params.get('activityId')),
				distinctUntilChanged(),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.loadData());
		this.handleMovementActions();
	}

	protected loadData(): void {
		this.facade
			.fetchActivity(this.id())
			.pipe(withLoading(this.entityLoading))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((entity) => this.entity.set(entity));
		this.facade.fetchActivityStatistics(this.id());
		this.facade.fetchActivityMovementsPage(this.id(), undefined, undefined);
	}

	private handleMovementActions(): void {
		this.movementFacade
			.handleMovementFirstPageReload()
			.pipe(
				tap(() => this.facade.fetchActivityMovementsPage(this.id(), 0, undefined)),
				tap(() => this.facade.reloadActivityStatistics(this.id())),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
		this.movementFacade
			.handleMovementCurrentPageReload()
			.pipe(
				tap(() => this.facade.reloadActivityMovementsPage(this.id())),
				tap(() => this.facade.reloadActivityStatistics(this.id())),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	protected search(model: ActivityMovementsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchActivityMovementsPage(this.id(), 0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(ACTIVITY_MOVEMENTS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: ActivityMovementsListSearchModel): void {
		const search = toActivityMovementsListSearchParams(model);
		this.facade.inputMovementsPageSearchParameters(
			search.type,
			search.from,
			search.to,
			search.isVisible,
			search.sort,
		);
	}

	protected retryStatistics(): void {
		this.facade.fetchActivityStatistics(this.id());
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchActivityMovementsPage(this.id(), pageEvent.page, pageEvent.size);
	}

	private id(): string {
		return this.route.snapshot.params['activityId'];
	}

	private buildTitle(): string {
		const entity: ActivityModel | undefined = this.entity();
		return entity ? entity.name : '';
	}

	private buildMovementDuration(): string | undefined {
		const seconds = this.facade.activityStatistics()?.movementSeconds;

		return seconds === undefined ? undefined : DurationHelper.toIsoHours(seconds);
	}

	private buildManDuration(): string | undefined {
		const seconds = this.facade.activityStatistics()?.manSeconds;

		return seconds === undefined ? undefined : DurationHelper.toIsoHours(seconds);
	}
}
