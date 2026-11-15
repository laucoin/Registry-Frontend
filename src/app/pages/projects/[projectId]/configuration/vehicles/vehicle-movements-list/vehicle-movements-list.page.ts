import { Component, inject } from '@angular/core';

import { SessionFacade } from '@core/registry/state/session.facade';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehicleStatisticsComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-statistics/vehicle-statistics.component';
import { ElementMovementsListComponent } from '@pages/projects/[projectId]/movements/element-movements/element-movements-list.component';
import { injectElementMovements } from '@pages/projects/[projectId]/movements/element-movements/inject-element-movements';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { PresenceTimelineComponent } from '@shared/ui/common/presence-timeline/presence-timeline.component';

/**
 * Objectif: Page listant les mouvements d'un véhicule avec ses frises et ses statistiques.
 * Périmètre: Relie les mouvements du véhicule, sa recherche, ses frises prévue et réelle et ses statistiques à la
 * facade des véhicules.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-vehicle-movements-list',
	imports: [ElementMovementsListComponent, PresenceTimelineComponent, VehicleStatisticsComponent],
	templateUrl: './vehicle-movements-list.page.html',
})
export class VehicleMovementsListPage {
	protected readonly facade = inject(VehicleFacade);
	protected readonly session = inject(SessionFacade);

	protected readonly movements = injectElementMovements<VehicleModel>({
		idParam: 'vehicleId',
		page: this.facade.vehicleMovementsPage,
		pageError: this.facade.vehicleMovementsPageError,
		pageLoading: this.facade.vehicleMovementsPageLoading,
		pageSilentLoading: this.facade.vehicleMovementsPageSilentLoading,
		appliedFilters: () => [
			this.facade.vehicleMovementsPageTypeParam(),
			this.facade.vehicleMovementsPageFromParam(),
			this.facade.vehicleMovementsPageToParam(),
			this.facade.vehicleMovementsPageIsVisibleParam(),
		],
		fetchElement: (id) => this.facade.fetchVehicle(id),
		fetchDetails: (id) => this.facade.fetchVehicleTimeline(id),
		reloadDetails: (id) => this.facade.reloadVehicleTimeline(id),
		fetchPage: (id, page, size) => this.facade.fetchVehicleMovementsPage(id, page, size),
		reloadPage: (id) => this.facade.reloadVehicleMovementsPage(id),
		inputSearch: (search) =>
			this.facade.inputMovementsPageSearchParameters(
				search.type,
				search.from,
				search.to,
				search.isVisible,
				search.sort,
			),
		titleOf: (vehicle) => vehicle.licensePlate,
	});
}
