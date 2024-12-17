import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { StateModel } from '../../../../shared/util-model/model/state.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { MovementDto } from '../dto/movement.dto'
import {
    CreateMovement,
    DeleteMovement,
    DisableMovement,
    EnableMovement,
    FetchMovement,
    FetchMovementPage,
    InputMovementPageDateRange,
    InputMovementPageSearch,
    ResetMovement,
    SelectMovementPageOrder,
    SelectMovementPageType,
    SelectMovementPageVisibility,
    StartMovementLoader,
    StartMovementsPageLoader,
    StopMovementLoader,
    StopMovementsPageLoader,
    UpdateMovement,
} from './movement.action'
import { ToastMessageOptions } from 'primeng/api'
import { MovementModel } from '../model/movement.model'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { MovementTypeEnum } from '../model/movement-type.enum'
import { ofActionSuccessful } from '@ngxs/store'

@Injectable()
export class MovementFacade extends GenericEventElementFacade<MovementModel> {
    public get page (): Observable<PageModel<MovementModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<MovementModel> | undefined => state.movement.movements.element )
    }

    public get actualPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.movement.movements.params.searched )
    }

    public get actualPageType (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.movement.movements.params.type )
    }

    public get actualPageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => FormUtil.buildDateRange(
            state.movement.movements.params.startDate,
            state.movement.movements.params.endDate,
        ) )
    }

    public get actualPageOnlyVisible (): boolean {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean => state.movement.movements.params.onlyVisible )
    }

    public get actualPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.movement.movements.params.order )
    }

    public get pageLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.movement.movements.loading )
    }

    public get pageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.movement.movements.silentLoading )
    }

    public get pageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.movement.movements.error )
    }

    public get element (): Observable<MovementModel | undefined> {
        return this.ngStore.select( (state: StateModel): MovementModel | undefined => state.movement.movement.element )
    }

    public get elementLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.movement.movement.loading )
    }

    public get elementError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.movement.movement.error )
    }

    public startPageLoader (): void {
        this.ngStore.dispatch( StartMovementsPageLoader )
    }

    public stopPageLoader (): void {
        this.ngStore.dispatch( StopMovementsPageLoader )
    }

    public fetchElementPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchMovementPage( eventId, offset, limit, force ) )
    }

    public inputPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputMovementPageSearch( searched ) )
    }

    public selectPageType (type: MovementTypeEnum | undefined): void {
        this.ngStore.dispatch( new SelectMovementPageType( type ) )
    }

    public inputPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputMovementPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectMovementPageVisibility( onlyVisible ) )
    }

    public selectPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectMovementPageOrder( order ) )
    }

    public startElementLoader (): void {
        this.ngStore.dispatch( StartMovementLoader )
    }

    public stopElementLoader (): void {
        this.ngStore.dispatch( StopMovementLoader )
    }

    public fetchElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchMovement( eventId, id ) )
    }

    public resetElement (): void {
        this.ngStore.dispatch( ResetMovement )
    }

    public createElement (
        movement: MovementDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateMovement> {
        this.ngStore.dispatch( new CreateMovement( eventId, movement ) )
        return this.actions$.pipe( ofActionSuccessful( CreateMovement ) )
    }

    public updateElement (
        id: string,
        movement: MovementDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateMovement> {
        this.ngStore.dispatch( new UpdateMovement( eventId, id, movement ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateMovement ) )
    }

    public disableElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableMovement( eventId, id ) )
    }

    public enableElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableMovement( eventId, id ) )
    }

    public deleteElement (element: MovementModel, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DeleteMovement( eventId, element ) )
    }
}
