import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehicleRoutesEnum } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-routes.enum';
import { VehicleRowComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/vehicle-row.component';
import {
	toVehiclesListSearchModel,
	toVehiclesListSearchParams,
	VEHICLES_LIST_SORT_FIELDS,
	VehiclesListSearchModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search';
import { VehiclesSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-search-fields/vehicles-search-fields.component';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

const VEHICLES_LIST_DEFAULTS = toVehiclesListSearchModel({
	q: undefined,
	at: undefined,
	status: undefined,
	isVisible: undefined,
	sort: undefined,
});
const VEHICLES_LIST_QUERY_SCHEMA: SearchQuerySchema<VehiclesListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	at: SearchQueryFieldKindEnum.DATE,
	status: SearchQueryFieldKindEnum.TEXT,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
};

/**
 * Objectif: Page listant les véhicules du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des véhicules, possède le formulaire de recherche et affiche chaque véhicule dans une ligne.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-vehicles-list',
	imports: [
		IfProjectAuthorityDirective,
		ListComponent,
		VehicleRowComponent,
		RegistryTemplateDirective,
		TranslocoPipe,
		RouterLink,
		RouterOutlet,
		VehiclesSearchFieldsComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './vehicles-list.page.html',
})
export class VehiclesListPage {
	protected readonly facade = inject(VehicleFacade);

	protected readonly createRoute: VehicleRoutesEnum = VehicleRoutesEnum.CREATE;

	protected readonly createAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_C;

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.vehiclesPageQueryParam()),
				this.facade.vehiclesPageAtParam() !== undefined,
				this.facade.vehiclesPageStatusParam() !== undefined,
				this.facade.vehiclesPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly model = signal(VEHICLES_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: VEHICLES_LIST_QUERY_SCHEMA,
		defaults: VEHICLES_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<VehiclesListSearchModel>(VEHICLES_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchVehiclesPage(undefined, undefined);
		},
	});

	protected search(model: VehiclesListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchVehiclesPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(VEHICLES_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: VehiclesListSearchModel): void {
		const search = toVehiclesListSearchParams(model);
		this.facade.inputPageSearchParameters(search.q, search.at, search.status, search.isVisible, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchVehiclesPage(pageEvent.page, pageEvent.size);
	}
}
