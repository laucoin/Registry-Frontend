import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import {
	toVehiclesListSearchModel,
	toVehiclesListSearchParams,
	VehiclesListSearchModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component';
import { ProjectVehicleOverviewComponent } from '@shared/ui/domain/project-vehicle-overview/project-vehicle-overview.component';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/list-item';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';

const VEHICLES_MONITORING_DEFAULTS = toVehiclesListSearchModel({
	q: undefined,
	at: undefined,
	status: undefined,
	isVisible: undefined,
	sort: undefined,
});
const VEHICLES_MONITORING_QUERY_SCHEMA: SearchQuerySchema<VehiclesListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	at: SearchQueryFieldKindEnum.DATE,
	status: SearchQueryFieldKindEnum.TEXT,
};
const VEHICLES_MONITORING_SORT_FIELDS: readonly string[] = ['licensePlate', 'brand', 'model', 'status'];
const PAGE_SIZE = 20;

/**
 * Objectif: Page de suivi de l'endroit où se trouvent les véhicules du projet.
 * Périmètre: Affiche les compteurs de véhicules sur ordinateur au-dessus d'une liste interrogeable des véhicules avec leur statut de présence et un déclencheur « charger plus ».
 * Limites: Ne détient aucun état de domaine ; la facade des véhicules le possède. Accessible uniquement quand le projet a l'option véhicule.
 */
@Component({
	selector: 'app-vehicles-monitoring',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	imports: [
		SortFieldsComponent,
		TranslocoPipe,
		FormField,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		ListComponent,
		MonitoringRowComponent,
		ProjectVehicleOverviewComponent,
	],
	templateUrl: './vehicles-monitoring.page.html',
})
export class VehiclesMonitoringPage {
	protected readonly facade = inject(VehicleFacade);

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.vehiclesPageQueryParam()),
				this.facade.vehiclesPageStatusParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = VEHICLES_MONITORING_SORT_FIELDS;
	protected readonly model = signal(VEHICLES_MONITORING_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: VEHICLES_MONITORING_QUERY_SCHEMA,
		defaults: VEHICLES_MONITORING_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<VehiclesListSearchModel>(VEHICLES_MONITORING_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchVehiclesPage(undefined, PAGE_SIZE);
		},
	});

	protected rowOf(vehicle: VehicleModel): MonitoringRowModel {
		return MonitoringRowHelper.fromVehicle(vehicle);
	}

	protected search(model: VehiclesListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchVehiclesPage(0, PAGE_SIZE);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(VEHICLES_MONITORING_DEFAULTS);
		this.search();
	}

	private inputSearch(model: VehiclesListSearchModel): void {
		const search = toVehiclesListSearchParams(model);
		this.facade.inputPageSearchParameters(search.q, search.at, search.status, undefined, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchVehiclesPage(pageEvent.page, pageEvent.size);
	}
}
