import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { VehicleDto } from '../dto/vehicle.dto'
import {
    CreateVehicle,
    DeleteVehicle,
    DisableVehicle,
    EnableVehicle,
    FetchVehicle,
    FetchVehicleMovementsContents,
    FetchVehicleMovementsPage,
    FetchVehiclePresencesStatus,
    FetchVehiclesPage,
    ResetVehicle,
    StartVehicleLoader,
    StartVehicleMovementsPageLoader,
    StartVehiclesPageLoader,
    StopVehicleLoader,
    StopVehicleMovementsPageLoader,
    StopVehiclesPageLoader,
    UpdateVehicle,
    UpdateVehicleMovementsPageSearchParams,
    UpdateVehiclesPageSearchParams,
} from './vehicle.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ActionCompletion, ofActionCompleted, ofActionSuccessful } from '@ngxs/store'
import { VehicleState } from './vehicle.state'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

@Injectable()
export class VehicleFacade extends GenericEventElementFacade {
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

    public get vehicle$ (): Observable<VehicleModel | undefined> {
        return this.ngStore.select( VehicleState.vehicle )
    }

    public get vehicle (): Signal<VehicleModel | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicle )
    }

    public get vehicleLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehicleLoading )
    }

    public get presencesStatusMetadata (): Signal<SelectItem<string | undefined>[]> {
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
        this.ngStore.dispatch( new FetchVehiclesPage( this.selectedEventId(), index, pageSize, force ) )
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
        this.ngStore.dispatch( new FetchVehicleMovementsPage( this.selectedEventId(), id, index, pageSize, force ) )
    }

    public fetchVehicleMovementsContent (movementIds: string[]): void {
        this.ngStore.dispatch( new FetchVehicleMovementsContents( this.selectedEventId(), movementIds ) )
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
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startVehicleLoader (): void {
        this.ngStore.dispatch( StartVehicleLoader )
    }

    public stopVehicleLoader (): void {
        this.ngStore.dispatch( StopVehicleLoader )
    }

    public fetchVehicle (id: string): void {
        this.ngStore.dispatch( new FetchVehicle( this.selectedEventId(), id ) )
    }

    public resetVehicle (): void {
        this.ngStore.dispatch( ResetVehicle )
    }

    public createVehicle (
        vehicle: VehicleDto,
    ): Observable<CreateVehicle> {
        this.ngStore.dispatch( new CreateVehicle( this.selectedEventId(), vehicle ) )
        return this.actions$.pipe( ofActionSuccessful( CreateVehicle ) )
    }

    public updateVehicle (
        id: string,
        vehicle: VehicleDto,
    ): Observable<UpdateVehicle> {
        this.ngStore.dispatch( new UpdateVehicle( this.selectedEventId(), id, vehicle ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateVehicle ) )
    }

    public disableVehicle (
        id: string,
    ): Observable<ActionCompletion<DisableVehicle>> {
        this.ngStore.dispatch( new DisableVehicle( this.selectedEventId(), id ) )

        return this.actions$.pipe( ofActionCompleted( DisableVehicle ) )
    }

    public enableVehicle (
        id: string,
    ): Observable<ActionCompletion<EnableVehicle>> {
        this.ngStore.dispatch( new EnableVehicle( this.selectedEventId(), id ) )

        return this.actions$.pipe( ofActionCompleted( EnableVehicle ) )
    }

    public deleteVehicle (
        vehicle: VehicleModel,
    ): Observable<ActionCompletion<DeleteVehicle>> {
        this.ngStore.dispatch( new DeleteVehicle( this.selectedEventId(), vehicle ) )

        return this.actions$.pipe( ofActionCompleted( DeleteVehicle ) )
    }

    public fetchPresencesStatus (): void {
        if (this.presencesStatusMetadata().length === 0) {
            this.ngStore.dispatch( FetchVehiclePresencesStatus )
        }
    }
}
