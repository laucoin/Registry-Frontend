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
    InputVehicleMovementsPageEndDateTimeSearched,
    InputVehicleMovementsPageStartDateTimeSearched,
    InputVehiclesPageDateTimeSearched,
    InputVehiclesPageTextSearched,
    ResetVehicle,
    SelectVehicleMovementsPageTypeSearched,
    SelectVehicleMovementsPageVisibilitySearched,
    SelectVehiclesPageAvailabilitySearched,
    SelectVehiclesPageVisibilitySearched,
    StartVehicleLoader,
    StartVehicleMovementsPageLoader,
    StartVehiclesPageLoader,
    StopVehicleLoader,
    StopVehicleMovementsPageLoader,
    StopVehiclesPageLoader,
    UpdateVehicle,
} from './vehicle.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
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
        return computed( (): boolean => this.ngStore.selectSignal( VehicleState.vehiclesPageLoading )() || this.registryFacade.contextEventLoading() )
    }

    public get vehiclesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageSilentLoading )
    }

    public get vehiclesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageError )
    }

    public get vehiclesPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageTextSearchedParam )
    }

    public get vehiclesPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( VehicleState.vehiclesPageDateTimeSearchedParam )() ),
        )
    }

    public get vehiclesPageAvailabilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageAvailabilitySearchedParam )
    }

    public get vehiclesPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehiclesPageVisibilitySearchedParam )
    }

    public get vehicleMovementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPage )
    }

    public get vehicleMovementsPageLoading (): Signal<boolean> {
        return computed( (): boolean =>
            this.ngStore.selectSignal( VehicleState.vehicleMovementsPageLoading )() || this.registryFacade.contextEventLoading(),
        )
    }

    public get vehicleMovementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageSilentLoading )
    }

    public get vehicleMovementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageError )
    }

    public get vehicleMovementsPageMovementTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( VehicleState.vehicleMovementsPageMovementTypeSearchedParam )
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
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchVehiclesPage( eventId, pageNumber, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        availabilitySearched: boolean | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (textSearched !== this.vehiclesPageTextSearchedParam()) {
            this.ngStore.dispatch( new InputVehiclesPageTextSearched( textSearched ) )
        }

        if (dateTimeSearched !== this.vehiclesPageDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputVehiclesPageDateTimeSearched( dateTimeSearched ) )
        }

        if (availabilitySearched !== this.vehiclesPageAvailabilitySearchedParam()) {
            this.ngStore.dispatch( new SelectVehiclesPageAvailabilitySearched( availabilitySearched ) )
        }

        if (visibilitySearched !== this.vehiclesPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectVehiclesPageVisibilitySearched( visibilitySearched ) )
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
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchVehicleMovementsPage( eventId, id, pageNumber, pageSize, force ) )
    }

    public fetchVehicleMovementsContent (
        movementIds: string[],
        eventId: string | undefined,
    ): void {
        this.ngStore.dispatch( new FetchVehicleMovementsContents( eventId, movementIds ) )
    }

    public inputMovementsPageSearchParameters (
        typeSearched: string | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (typeSearched !== this.vehicleMovementsPageMovementTypeSearchedParam()) {
            this.ngStore.dispatch( new SelectVehicleMovementsPageTypeSearched( typeSearched ) )
        }

        if (startDateTimeSearched !== this.vehicleMovementsPageStartDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputVehicleMovementsPageStartDateTimeSearched( startDateTimeSearched ) )
        }

        if (endDateTimeSearched !== this.vehicleMovementsPageEndDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputVehicleMovementsPageEndDateTimeSearched( endDateTimeSearched ) )
        }

        if (visibilitySearched !== this.vehicleMovementsPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectVehicleMovementsPageVisibilitySearched( visibilitySearched ) )
        }
    }

    public startVehicleLoader (): void {
        this.ngStore.dispatch( StartVehicleLoader )
    }

    public stopVehicleLoader (): void {
        this.ngStore.dispatch( StopVehicleLoader )
    }

    public fetchVehicle (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchVehicle( eventId, id ) )
    }

    public resetVehicle (): void {
        this.ngStore.dispatch( ResetVehicle )
    }

    public createVehicle (
        vehicle: VehicleDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateVehicle> {
        this.ngStore.dispatch( new CreateVehicle( eventId, vehicle ) )
        return this.actions$.pipe( ofActionSuccessful( CreateVehicle ) )
    }

    public updateVehicle (
        id: string,
        vehicle: VehicleDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateVehicle> {
        this.ngStore.dispatch( new UpdateVehicle( eventId, id, vehicle ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateVehicle ) )
    }

    public disableVehicle (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableVehicle( eventId, id ) )
    }

    public enableVehicle (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableVehicle( eventId, id ) )
    }

    public deleteVehicle (
        vehicle: VehicleModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new DeleteVehicle( eventId, vehicle ) )
    }

    public fetchPresencesStatus (): void {
        if (this.presencesStatusMetadata().length === 0) {
            this.ngStore.dispatch( FetchVehiclePresencesStatus )
        }
    }
}
