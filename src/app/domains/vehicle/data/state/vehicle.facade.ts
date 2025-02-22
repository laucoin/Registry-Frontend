import { Injectable } from '@angular/core'
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
    FetchVehicleMovementsPage,
    FetchVehicleMovementTypes,
    FetchVehiclesPage,
    InputVehicleMovementsPageDateRange,
    InputVehicleMovementsPageSearch,
    InputVehiclesPageDateRange,
    InputVehiclesPageSearch,
    ResetVehicle,
    SelectVehicleMovementsPageOrder,
    SelectVehicleMovementsPageType,
    SelectVehicleMovementsPageVisibility,
    SelectVehiclesPageOrder,
    SelectVehiclesPageVisibility,
    StartVehicleLoader,
    StartVehicleMovementsPageLoader,
    StartVehiclesPageLoader,
    StopVehicleLoader,
    StopVehicleMovementsPageLoader,
    StopVehiclesPageLoader,
    UpdateVehicle,
} from './vehicle.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { VehicleState } from './vehicle.state'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { MovementModel } from '../../../../shared/util-model/movement.model'

@Injectable()
export class VehicleFacade extends GenericEventElementFacade {
    public get vehiclesPage (): Observable<PageModel<VehicleModel> | undefined> {
        return this.ngStore.select( VehicleState.vehiclesPage )
    }

    public get vehiclesPageLoading (): Observable<boolean> {
        return this.ngStore.select( VehicleState.vehiclesPageLoading )
    }

    public get vehiclesPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( VehicleState.vehiclesPageSilentLoading )
    }

    public get vehiclesPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( VehicleState.vehiclesPageError )
    }

    public get actualVehiclesPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( VehicleState.vehiclesPageSearchParam )
    }

    public get actualVehiclesPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( VehicleState.vehiclesPageStartDateParam ),
            this.ngStore.selectSnapshot( VehicleState.vehiclesPageEndDateParam ),
        )
    }

    public get actualVehiclesPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( VehicleState.vehiclesPageOnlyVisibleParam )
    }

    public get actualVehiclesPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( VehicleState.vehiclesPageOrderParam )
    }

    public get vehicleMovementsPage (): Observable<PageModel<MovementModel> | undefined> {
        return this.ngStore.select( VehicleState.vehicleMovementsPage )
    }

    public get vehicleMovementsPageLoading (): Observable<boolean> {
        return this.ngStore.select( VehicleState.vehicleMovementsPageLoading )
    }

    public get vehicleMovementsPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( VehicleState.vehicleMovementsPageSilentLoading )
    }

    public get vehicleMovementsPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( VehicleState.vehicleMovementsPageError )
    }

    public get actualVehicleMovementsPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( VehicleState.vehicleMovementsPageSearchParam )
    }

    public get actualVehicleMovementsPageMovementTypeParam (): string | undefined {
        return this.ngStore.selectSnapshot( VehicleState.vehicleMovementsPageMovementTypeParam )
    }

    public get actualVehicleMovementsPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( VehicleState.vehicleMovementsPageStartDateParam ),
            this.ngStore.selectSnapshot( VehicleState.vehicleMovementsPageEndDateParam ),
        )
    }

    public get actualVehicleMovementsPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( VehicleState.vehicleMovementsPageOnlyVisibleParam )
    }

    public get actualVehicleMovementsPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( VehicleState.vehicleMovementsPageOrderParam )
    }

    public get vehicle (): Observable<VehicleModel | undefined> {
        return this.ngStore.select( VehicleState.vehicle )
    }

    public get vehicleLoading (): Observable<boolean> {
        return this.ngStore.select( VehicleState.vehicleLoading )
    }

    public get movementTypesMetadata (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( VehicleState.movementTypesMetadata )
    }

    public startVehiclesPageLoader (): void {
        this.ngStore.dispatch( StartVehiclesPageLoader )
    }

    public stopVehiclesPageLoader (): void {
        this.ngStore.dispatch( StopVehiclesPageLoader )
    }

    public fetchVehiclesPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchVehiclesPage( eventId, offset, limit, force ) )
    }

    public inputVehiclesPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputVehiclesPageSearch( searched ) )
    }

    public inputVehiclesPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputVehiclesPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectVehiclesPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectVehiclesPageVisibility( onlyVisible ) )
    }

    public selectVehiclesPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectVehiclesPageOrder( order ) )
    }

    public startVehicleMovementsPageLoader (): void {
        this.ngStore.dispatch( StartVehicleMovementsPageLoader )
    }

    public stopVehicleMovementsPageLoader (): void {
        this.ngStore.dispatch( StopVehicleMovementsPageLoader )
    }

    public fetchVehicleMovementTypes (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchVehicleMovementTypes( eventId ) )
    }

    public fetchVehicleMovementsPage (
        id: string,
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchVehicleMovementsPage( eventId, id, offset, limit, force ) )
    }

    public inputVehicleMovementsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputVehicleMovementsPageSearch( searched ) )
    }

    public selectVehicleMovementsPageType (type: string | undefined): void {
        this.ngStore.dispatch( new SelectVehicleMovementsPageType( type ) )
    }

    public inputVehicleMovementsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputVehicleMovementsPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectVehicleMovementsPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectVehicleMovementsPageVisibility( onlyVisible ) )
    }

    public selectVehicleMovementsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectVehicleMovementsPageOrder( order ) )
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

    public handleVehicleCreation (): Observable<CreateVehicle> {
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
}
