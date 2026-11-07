import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';
import { distinctUntilChanged, map, tap } from 'rxjs';

import { SessionFacade } from '@core/registry/state/session.facade';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import {
	toVehicleMovementsListSearchModel,
	toVehicleMovementsListSearchParams,
	VEHICLE_MOVEMENTS_LIST_SORT_FIELDS,
	VehicleMovementsListSearchModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.search';
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
import { PageEventModel } from '@shared/models/model/page-event.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { PresenceTimelineComponent } from '@shared/ui/common/presence-timeline/presence-timeline.component';
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

const VEHICLE_MOVEMENTS_LIST_DEFAULTS = toVehicleMovementsListSearchModel({
	type: undefined,
	from: undefined,
	to: undefined,
	isVisible: undefined,
	sort: undefined,
});
const VEHICLE_MOVEMENTS_LIST_QUERY_SCHEMA: SearchQuerySchema<VehicleMovementsListSearchModel> = {
	type: 'text',
	from: 'date',
	to: 'date',
	isVisible: 'choice',
};

/**
 * Purpose: Page listant les mouvements d'un véhicule avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des véhicules, possède le formulaire de recherche, affiche le nom du véhicule, ses frises prévue et réelle, son temps en sortie et son taux d'utilisation, et recharge quand un mouvement change.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-vehicle-movements-list',
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
	templateUrl: './vehicle-movements-list.page.html',
})
export class VehicleMovementsListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_RESTORE;

	private readonly destroyRef = inject(DestroyRef);
	protected readonly facade = inject(VehicleFacade);
	protected readonly movementFacade = inject(MovementFacade);
	protected readonly session = inject(SessionFacade);
	private readonly route = inject(ActivatedRoute);

	protected readonly entity: WritableSignal<VehicleModel | undefined> = signal(undefined);
	protected readonly entityLoading = signal(false);

	protected readonly title = computed(() => this.buildTitle());

	protected readonly outDuration = computed(() => this.buildOutDuration());

	protected readonly activeFilters = computed(
		() =>
			[
				this.facade.vehicleMovementsPageTypeParam() !== undefined,
				this.facade.vehicleMovementsPageFromParam() !== undefined,
				this.facade.vehicleMovementsPageToParam() !== undefined,
				this.facade.vehicleMovementsPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = VEHICLE_MOVEMENTS_LIST_SORT_FIELDS;
	protected readonly model = signal(VEHICLE_MOVEMENTS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: VEHICLE_MOVEMENTS_LIST_QUERY_SCHEMA,
		defaults: VEHICLE_MOVEMENTS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<VehicleMovementsListSearchModel>(VEHICLE_MOVEMENTS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model, initial) => {
			this.inputSearch(model);
			if (!initial) {
				this.facade.fetchVehicleMovementsPage(this.id(), undefined, undefined);
			}
		},
	});

	constructor() {
		this.route.paramMap
			.pipe(
				map((params) => params.get('vehicleId')),
				distinctUntilChanged(),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.loadData());
		this.handleMovementActions();
	}

	protected loadData(): void {
		this.facade
			.fetchVehicle(this.id())
			.pipe(withLoading(this.entityLoading))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((entity) => this.entity.set(entity));
		this.facade.fetchVehicleTimeline(this.id());
		this.facade.fetchVehicleMovementsPage(this.id(), undefined, undefined);
	}

	private handleMovementActions(): void {
		this.movementFacade
			.handleMovementFirstPageReload()
			.pipe(
				tap(() => this.facade.fetchVehicleMovementsPage(this.id(), 0, undefined)),
				tap(() => this.facade.reloadVehicleTimeline(this.id())),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
		this.movementFacade
			.handleMovementCurrentPageReload()
			.pipe(
				tap(() => this.facade.reloadVehicleMovementsPage(this.id())),
				tap(() => this.facade.reloadVehicleTimeline(this.id())),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	protected search(model: VehicleMovementsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchVehicleMovementsPage(this.id(), 0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(VEHICLE_MOVEMENTS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: VehicleMovementsListSearchModel): void {
		const search = toVehicleMovementsListSearchParams(model);
		this.facade.inputMovementsPageSearchParameters(
			search.type,
			search.from,
			search.to,
			search.isVisible,
			search.sort,
		);
	}

	protected retryTimeline(): void {
		this.facade.fetchVehicleTimeline(this.id());
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchVehicleMovementsPage(this.id(), pageEvent.page, pageEvent.size);
	}

	private id(): string {
		return this.route.snapshot.params['vehicleId'];
	}

	private buildTitle(): string {
		const entity: VehicleModel | undefined = this.entity();
		return entity ? entity.licensePlate : '';
	}

	private buildOutDuration(): string | undefined {
		const seconds = this.facade.vehicleTimeline()?.outSeconds;

		return seconds === undefined ? undefined : DurationHelper.toIsoDuration(seconds);
	}
}
