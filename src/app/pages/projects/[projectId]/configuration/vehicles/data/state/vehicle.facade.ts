import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import {
    FetchVehicleMovementsContents,
    FetchVehicleMovementsPage,
    FetchVehiclePresencesStatus,
    FetchVehiclesPage,
    StartVehicleMovementsPageLoader,
    StartVehiclesPageLoader,
    StopVehicleMovementsPageLoader,
    StopVehiclesPageLoader,
    UpdateVehicleMovementsPageSearchParams,
    UpdateVehiclesPageSearchParams,
} from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { VehicleState } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.state'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateUtil } from '@shared/helpers/util/date.util'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/util/rx.util'

@Injectable()
export class VehicleFacade extends GenericProjectElementFacade {
    private readonly api: VehicleApi = inject( VehicleApi )

    public get vehiclesPage (): Signal<PageModel<VehicleModel> | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPage )
    }

    public get vehiclesPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageLoading )
    }

    public get vehiclesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageSilentLoading )
    }

    public get vehiclesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageError )
    }

    public get vehiclesPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageResetSearch )
    }

    public get vehiclesPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageTextSearchedParam )
    }

    public get vehiclesPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( VehicleState.vehiclesPageDateTimeSearchedParam )() ),
        )
    }

    public get vehiclesPageStatusSearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageAvailabilitySearchedParam )
    }

    public get vehiclesPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageVisibilitySearchedParam )
    }

    public get vehicleMovementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPage )
    }

    public get vehicleMovementsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageLoading )
    }

    public get vehicleMovementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageSilentLoading )
    }

    public get vehicleMovementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageError )
    }

    private get vehicleMovementsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageResetSearch )
    }

    public get vehicleMovementsPageTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageTypeSearchedParam )
    }

    public get vehicleMovementsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( VehicleState.vehicleMovementsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get vehicleMovementsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( VehicleState.vehicleMovementsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get vehicleMovementsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageVisibilitySearchedParam )
    }

    public get presencesStatusMetadata (): Signal<SelectItem<PresenceStatusEnum | undefined>[]> {
        return this.ngStore.selectSignal( VehicleState.presencesStatusMetadata )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( VehicleState.visibilitiesMetadata )().map(
                (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                    ...status,
                    label: this.translateService.instant( status.label! ),
                }),
            ),
        )
    }

    public startVehiclesPageLoader (): void {
        this.ngStore.dispatch( StartVehiclesPageLoader )
    }

    public stopVehiclesPageLoader (): void {
        this.ngStore.dispatch( StopVehiclesPageLoader )
    }

    public fetchVehiclesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.vehiclesPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchVehiclesPage( this.selectedProjectId(), index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        statusSearched: boolean | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.vehiclesPageTextSearchedParam() != textSearched
                                     || this.vehiclesPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.vehiclesPageStatusSearchedParam() != statusSearched
                                     || this.vehiclesPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateVehiclesPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                statusSearched: statusSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startVehicleMovementsPageLoader (): void {
        this.ngStore.dispatch( StartVehicleMovementsPageLoader )
    }

    public stopVehicleMovementsPageLoader (): void {
        this.ngStore.dispatch( StopVehicleMovementsPageLoader )
    }

    public fetchVehicleMovementsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.vehicleMovementsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchVehicleMovementsPage( this.selectedProjectId(), id, index, pageSize, force ) )
    }

    public fetchVehicleMovementsContent (movementIds: string[]): void {
        this.ngStore.dispatch( new FetchVehicleMovementsContents( this.selectedProjectId(), movementIds ) )
    }

    public inputMovementsPageSearchParameters (
        typeSearched: string | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.vehicleMovementsPageTypeSearchedParam() != typeSearched
                                     || this.vehicleMovementsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.vehicleMovementsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()
                                     || this.vehicleMovementsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateVehicleMovementsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                currentMovements: false,
                linkedToActivity: undefined,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public fetchVehicle (id: string): Observable<VehicleModel> {
        return this.api.findVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createVehicle (vehicle: VehicleDto): Observable<VehicleModel> {
        return this.api.createVehicle( this.selectedProjectId(), vehicle ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: VehicleModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateVehicle (id: string, vehicle: VehicleDto): Observable<VehicleModel> {
        return this.api.updateVehicleById( this.selectedProjectId(), id, vehicle ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: VehicleModel): void => this.onCommandSuccess( 'edit', updated ) ),
        )
    }

    public disableVehicle (id: string): Observable<VehicleModel> {
        return this.api.disableVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: VehicleModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableVehicle (id: string): Observable<VehicleModel> {
        return this.api.enableVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: VehicleModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteVehicle (vehicle: VehicleModel): Observable<void> {
        return this.api.deleteVehicleById( undefined, vehicle.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', vehicle ) ),
        )
    }

    private onCommandSuccess (command: string, vehicle: VehicleModel): void {
        this.notifySuccess( `vehicles.notifications.${ command }`, 'pi pi-users', {
            registration: vehicle?.licensePlate,
            brand: vehicle?.brand,
            model: vehicle?.model,
        } )

        const page: PageModel<VehicleModel> | undefined = this.vehiclesPage()
        this.fetchVehiclesPage( page?.pageNumber, page?.pageSize, true )
    }

    public fetchPresencesStatus (): void {
        this.ngStore.dispatch( FetchVehiclePresencesStatus )
    }
}
