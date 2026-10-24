import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'

/**
 * Purpose: Public entry point of the vehicle domain for pages, components and guards.
 * Scope: Exposes the vehicle store as signals, forwards its queries and runs the vehicle commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class VehicleFacade extends GenericProjectElementFacade {
    private readonly api: VehicleApi = inject( VehicleApi )

    private readonly store: InstanceType<typeof VehicleStore> = inject( VehicleStore )

    public readonly vehiclesPage: Signal<PageModel<VehicleModel> | undefined> = this.store.vehicles.element
    public readonly vehiclesPageLoading: Signal<boolean> = this.store.vehicles.loading
    public readonly vehiclesPageSilentLoading: Signal<boolean> = this.store.vehicles.silentLoading
    public readonly vehiclesPageError: Signal<NotificationModel | undefined> = this.store.vehicles.error
    public readonly vehiclesPageResetSearch: Signal<boolean> = this.store.vehicles.params.resetSearch
    public readonly vehiclesPageQueryParam: Signal<string | undefined> = this.store.vehicles.params.q
    public readonly vehiclesPageAtParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.vehicles.params.at() ),
    )
    public readonly vehiclesPageStatusParam: Signal<string | undefined> = this.store.vehicles.params.status
    public readonly vehiclesPageIsVisibleParam: Signal<boolean | undefined> = this.store.vehicles.params.isVisible

    public readonly vehicleMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element
    public readonly vehicleMovementsPageLoading: Signal<boolean> = this.store.movements.loading
    public readonly vehicleMovementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading
    public readonly vehicleMovementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error
    private readonly vehicleMovementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch
    public readonly vehicleMovementsPageTypeParam: Signal<string | undefined> = this.store.movements.params.type
    public readonly vehicleMovementsPageFromParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.from() ),
    )
    public readonly vehicleMovementsPageToParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.to() ),
    )
    public readonly vehicleMovementsPageIsVisibleParam: Signal<boolean | undefined> = this.store.movements.params.isVisible

    public readonly presencesStatusMetadata: Signal<SelectOptionModel<PresenceStatusEnum | undefined>[]> = this.store.metadata.presencesStatus
    public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( (): SelectOptionModel<boolean | undefined>[] =>
        this.store.metadata.visibilities().map(
            (status: SelectOptionModel<boolean | undefined>): SelectOptionModel<boolean | undefined> => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }),
        ),
    )

    public fetchVehiclesPage (
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.vehiclesPageResetSearch() ? 0 : page
        this.store.fetchVehiclesPage( { projectId: this.selectedProjectId(), page: index, size: size } )
    }

    public inputPageSearchParameters (
        q: string | undefined,
        at: Date | undefined,
        status: string | undefined,
        isVisible: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.vehiclesPageQueryParam() != q
                                     || this.vehiclesPageAtParam()?.toISOString() != at?.toISOString()
                                     || this.vehiclesPageStatusParam() != status
                                     || this.vehiclesPageIsVisibleParam() != isVisible

        if (resetSearch) {
            this.store.updateVehiclesPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                q: q,
                status: status,
                at: at?.toISOString(),
            } )
        }
    }

    public fetchVehicleMovementsPage (
        id: string,
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.vehicleMovementsPageResetSearch() ? 0 : page
        this.store.fetchVehicleMovementsPage( { projectId: this.selectedProjectId(), id: id, page: index, size: size } )
    }

    public reloadVehicleMovementsPage (id: string): void {
        this.store.fetchVehicleMovementsPage( { projectId: this.selectedProjectId(), id: id, ...CumulativePageHelper.reloadRequest( this.vehicleMovementsPage() ) } )
    }

    public inputMovementsPageSearchParameters (
        type: string | undefined,
        from: Date | undefined,
        to: Date | undefined,
        isVisible: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.vehicleMovementsPageTypeParam() != type
                                     || this.vehicleMovementsPageFromParam()?.toISOString() != from?.toISOString()
                                     || this.vehicleMovementsPageToParam()?.toISOString() != to?.toISOString()
                                     || this.vehicleMovementsPageIsVisibleParam() != isVisible

        if (resetSearch) {
            this.store.updateVehicleMovementsPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                isCurrent: false,
                hasActivity: undefined,
                type: type,
                from: from?.toISOString(),
                to: to?.toISOString(),
            } )
        }
    }

    public fetchVehicle (id: string): Observable<VehicleModel> {
        return this.api.findVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
        )
    }

    public createVehicle (vehicle: VehicleDto): Observable<VehicleModel> {
        return this.api.createVehicle( this.selectedProjectId(), vehicle ).pipe(
            tap( (created: VehicleModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateVehicle (id: string, vehicle: VehicleDto, ifMatch?: string): Observable<VehicleModel> {
        return this.api.updateVehicleById( this.selectedProjectId(), id, vehicle, ifMatch ).pipe(
            tap( (updated: VehicleModel): void => this.onCommandSuccess( 'edit', updated ) ),
        )
    }

    public disableVehicle (id: string): Observable<VehicleModel> {
        return this.api.disableVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: VehicleModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableVehicle (id: string): Observable<VehicleModel> {
        return this.api.enableVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: VehicleModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteVehicle (vehicle: VehicleModel): Observable<void> {
        return this.api.deleteVehicleById( undefined, vehicle.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', vehicle ) ),
        )
    }

    private onCommandSuccess (command: string, vehicle: VehicleModel): void {
        this.notifySuccess( `vehicles.notifications.${ command }`, {
            registration: vehicle?.licensePlate,
            brand: vehicle?.brand,
            model: vehicle?.model,
        } )

        this.store.fetchVehiclesPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.vehiclesPage() ) } )
    }
}
