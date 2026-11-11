import { computed, inject, Injectable, Signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto';
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api';
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store';
import { DateHelper } from '@shared/helpers/date.helper';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { VehicleTimelineModel } from '@shared/models/model/vehicle-timeline.model';

/**
 * Objectif: Point d'entrée public du domaine des véhicules pour les pages, composants et guards.
 * Périmètre: Expose le store des véhicules sous forme de signals, relaie ses requêtes et exécute les commandes de véhicule avec leurs notifications.
 * Limites: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class VehicleFacade extends GenericProjectElementFacade {
	private readonly api = inject(VehicleApi);

	private readonly store: InstanceType<typeof VehicleStore> = inject(VehicleStore);

	public readonly vehiclesPage: Signal<PageModel<VehicleModel> | undefined> = this.store.vehicles.element;
	public readonly vehiclesPageLoading = this.store.vehicles.loading;
	public readonly vehiclesPageSilentLoading = this.store.vehicles.silentLoading;
	public readonly vehiclesPageError: Signal<NotificationModel | undefined> = this.store.vehicles.error;
	private readonly vehiclesPageResetSearch = this.store.vehicles.params.resetSearch;
	public readonly vehiclesPageQueryParam = this.store.vehicles.params.q;

	public readonly vehiclesPageAtParam = computed(() => DateHelper.buildDate(this.store.vehicles.params.at()));
	public readonly vehiclesPageStatusParam = this.store.vehicles.params.status;
	public readonly vehiclesPageIsVisibleParam = this.store.vehicles.params.isVisible;

	public readonly vehicleMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element;
	public readonly vehicleMovementsPageLoading = this.store.movements.loading;
	public readonly vehicleMovementsPageSilentLoading = this.store.movements.silentLoading;
	public readonly vehicleMovementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error;
	public readonly vehicleTimeline: Signal<VehicleTimelineModel | undefined> = this.store.timeline.element;
	public readonly vehicleTimelineLoading = this.store.timeline.loading;
	public readonly vehicleTimelineError: Signal<NotificationModel | undefined> = this.store.timeline.error;
	private readonly vehicleMovementsPageResetSearch = this.store.movements.params.resetSearch;
	public readonly vehicleMovementsPageTypeParam = this.store.movements.params.type;

	public readonly vehicleMovementsPageFromParam = computed(() =>
		DateHelper.buildDate(this.store.movements.params.from()),
	);
	public readonly vehicleMovementsPageToParam = computed(() =>
		DateHelper.buildDate(this.store.movements.params.to()),
	);
	public readonly vehicleMovementsPageIsVisibleParam = this.store.movements.params.isVisible;

	public readonly presencesStatusMetadata = this.store.metadata.presencesStatus;
	public readonly visibilitiesMetadata = this.translatedOptions(this.store.metadata.visibilities);

	public fetchVehiclesPage(page: number | undefined, size: number | undefined): void {
		const index = this.vehiclesPageResetSearch() ? 0 : page;
		this.store.fetchVehiclesPage({ projectId: this.selectedProjectId(), page: index, size: size });
	}

	public inputPageSearchParameters(
		q: string | undefined,
		at: Date | undefined,
		status: string | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			isVisible,
			q,
			status,
			at: DateHelper.toIsoInstant(at),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.vehicles.params(), next)) return;
		this.store.updateVehiclesPageSearchParams({ ...next, resetSearch: true });
	}

	public fetchVehicleMovementsPage(id: string, page: number | undefined, size: number | undefined): void {
		const index = this.vehicleMovementsPageResetSearch() ? 0 : page;
		this.store.fetchVehicleMovementsPage({ projectId: this.selectedProjectId(), id: id, page: index, size: size });
	}

	public fetchVehicleTimeline(id: string): void {
		this.store.fetchVehicleTimeline({ projectId: this.selectedProjectId(), id: id });
	}

	public reloadVehicleTimeline(id: string): void {
		this.store.reloadVehicleTimeline({ projectId: this.selectedProjectId(), id: id });
	}

	public reloadVehicleMovementsPage(id: string): void {
		this.store.fetchVehicleMovementsPage({
			projectId: this.selectedProjectId(),
			id: id,
			...CumulativePageHelper.reloadRequest(this.vehicleMovementsPage()),
		});
	}

	public inputMovementsPageSearchParameters(
		type: string | undefined,
		from: Date | undefined,
		to: Date | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			isVisible,
			type,
			from: DateHelper.toIsoInstant(from),
			to: DateHelper.toIsoInstant(to),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.movements.params(), next)) return;
		this.store.updateVehicleMovementsPageSearchParams({
			...next,
			resetSearch: true,
			isCurrent: false,
			hasActivity: undefined,
		});
	}

	public fetchVehicle(id: string): Observable<VehicleModel> {
		return this.api.findVehicleById(this.selectedProjectId(), id).pipe(notifyOnError(this.uiFacade));
	}

	public createVehicle(vehicle: VehicleDto): Observable<VehicleModel> {
		return this.api
			.createVehicle(this.selectedProjectId(), vehicle)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public updateVehicle(id: string, vehicle: VehicleDto, ifMatch?: string): Observable<VehicleModel> {
		return this.api
			.updateVehicleById(this.selectedProjectId(), id, vehicle, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('edit', updated)));
	}

	public softDeleteVehicle(id: string): Observable<VehicleModel> {
		return this.api.softDeleteVehicleById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((disabled) => this.onCommandSuccess('softDelete', disabled)),
		);
	}

	public restoreVehicle(id: string): Observable<VehicleModel> {
		return this.api.restoreVehicleById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((enabled) => this.onCommandSuccess('restore', enabled)),
		);
	}

	public hardDeleteVehicle(vehicle: VehicleModel): Observable<void> {
		return this.api.hardDeleteVehicleById(undefined, vehicle.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('hardDelete', vehicle)),
		);
	}

	private onCommandSuccess(command: string, vehicle: VehicleModel): void {
		this.notifySuccess(`vehicles.notifications.${command}`, {
			registration: vehicle.licensePlate,
			brand: vehicle.brand,
			model: vehicle.model,
		});

		this.store.fetchVehiclesPage({
			projectId: this.selectedProjectId(),
			...CumulativePageHelper.reloadRequest(this.vehiclesPage()),
		});
	}
}
