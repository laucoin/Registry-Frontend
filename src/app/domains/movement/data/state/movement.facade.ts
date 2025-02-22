import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { MovementState } from './movement.state'
import {
    CreateMovement,
    DeleteMovement,
    DisableMovement,
    EnableMovement,
    FetchMovement,
    FetchMovementsPage,
    FetchMovementTypes,
    InputMovementsPageDateRange,
    InputMovementsPageSearch,
    ResetMovement,
    SearchParticipantsAndGroups,
    SearchVehicles,
    SelectMovementsPageOrder,
    SelectMovementsPageType,
    SelectMovementsPageVisibility,
    StartMovementLoader,
    StartMovementsPageLoader,
    StopMovementLoader,
    StopMovementsPageLoader,
    UpdateMovement,
} from './movement.action'
import { MovementDto } from '../dto/movement.dto'
import { MovementModel } from '../../../../shared/util-model/movement.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'

@Injectable()
export class MovementFacade extends GenericEventElementFacade {
    public get movementsPage (): Observable<PageModel<MovementModel> | undefined> {
        return this.ngStore.select( MovementState.movementsPage )
    }

    public get movementsPageLoading (): Observable<boolean> {
        return this.ngStore.select( MovementState.movementsPageLoading )
    }

    public get movementsPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( MovementState.movementsPageSilentLoading )
    }

    public get movementsPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( MovementState.movementsPageError )
    }

    public get actualMovementsPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( MovementState.movementsPageSearchParam )
    }

    public get actualMovementsPageMovementTypeParam (): string | undefined {
        return this.ngStore.selectSnapshot( MovementState.movementsPageMovementTypeParam )
    }

    public get actualMovementsPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( MovementState.movementsPageStartDateParam ),
            this.ngStore.selectSnapshot( MovementState.movementsPageEndDateParam ),
        )
    }

    public get actualMovementsPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( MovementState.movementsPageOnlyVisibleParam )
    }

    public get actualMovementsPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( MovementState.movementsPageOrderParam )
    }

    public get movement (): Observable<MovementModel | undefined> {
        return this.ngStore.select( MovementState.movement )
    }

    public get movementLoading (): Observable<boolean> {
        return this.ngStore.select( MovementState.movementLoading )
    }

    public get searchedParticipantAndGroupMetadata (): Observable<SelectItemGroup<ParticipantModel | GroupModel>[]> {
        return this.ngStore.select( MovementState.searchedParticipantAndGroupMetadata )
    }

    public get searchedVehicleMetadata (): Observable<SelectItem<VehicleModel>[]> {
        return this.ngStore.select( MovementState.searchedVehicleMetadata )
    }

    public get movementTypesMetadata (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( MovementState.movementTypesMetadata )
    }

    public startMovementsPageLoader (): void {
        this.ngStore.dispatch( StartMovementsPageLoader )
    }

    public stopMovementsPageLoader (): void {
        this.ngStore.dispatch( StopMovementsPageLoader )
    }

    public fetchMovementsPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchMovementsPage( eventId, offset, limit, force ) )
    }

    public inputMovementsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputMovementsPageSearch( searched ) )
    }

    public selectMovementsPageMovementType (type: string | undefined): void {
        this.ngStore.dispatch( new SelectMovementsPageType( type ) )
    }

    public inputMovementsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputMovementsPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectMovementsPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectMovementsPageVisibility( onlyVisible ) )
    }

    public selectMovementsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectMovementsPageOrder( order ) )
    }

    public startMovementLoader (): void {
        this.ngStore.dispatch( StartMovementLoader )
    }

    public stopMovementLoader (): void {
        this.ngStore.dispatch( StopMovementLoader )
    }

    public fetchMovement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchMovement( eventId, id ) )
    }

    public searchParticipantsAndGroups (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchParticipantsAndGroups( eventId, searched ) )
    }

    public searchVehicles (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchVehicles( eventId, searched ) )
    }

    public resetMovement (): void {
        this.ngStore.dispatch( ResetMovement )
    }

    public createMovement (
        movement: MovementDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateMovement> {
        this.ngStore.dispatch( new CreateMovement( eventId, movement ) )
        return this.actions$.pipe( ofActionSuccessful( CreateMovement ) )
    }

    public handleMovementCreation (): Observable<CreateMovement> {
        return this.actions$.pipe( ofActionSuccessful( CreateMovement ) )
    }

    public updateMovement (
        id: string,
        movement: MovementDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateMovement> {
        this.ngStore.dispatch( new UpdateMovement( eventId, id, movement ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateMovement ) )
    }

    public disableMovement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableMovement( eventId, id ) )
    }

    public enableMovement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableMovement( eventId, id ) )
    }

    public deleteMovement (
        movement: MovementModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new DeleteMovement( eventId, movement ) )
    }

    public fetchMovementTypes (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchMovementTypes( eventId ) )
    }
}
