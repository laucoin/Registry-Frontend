import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { EventModel } from '../../../../shared/util-model/model/event.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { StateModel } from '../../../../shared/util-model/model/state.model'
import { GenericElementFacade } from '../../../../shared/util-tool/facade/generic-element.facade'
import { EventDto } from '../dto/event.dto'
import {
    CreateEvent,
    DeleteEvent,
    DisableEvent,
    EnableEvent,
    FetchEvent,
    FetchEventPage,
    InputEventPageDateRange,
    InputEventPageSearch,
    ResetEvent,
    SelectEventPageOrder,
    SelectEventPageVisibility,
    StartEventLoader,
    StartEventsPageLoader,
    StopEventLoader,
    StopEventsPageLoader,
    UpdateEvent,
} from './event.action'
import { ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

@Injectable()
export class EventFacade extends GenericElementFacade<EventModel> {
    public get page (): Observable<PageModel<EventModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<EventModel> | undefined => state.event.events.element )
    }

    public get actualPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.event.events.params.searched )
    }

    public get actualPageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => {
            let range: Date[] = []
            if (state.event.events.params.startDate) {
                range = [ new Date( state.event.events.params.startDate ) ]

                if (state.event.events.params.endDate) {
                    range = [ ...range, new Date( state.event.events.params.endDate ) ]
                }
            }
            return range
        } )
    }

    public get actualPageVisibility (): boolean {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean => state.event.events.params.onlyVisible )
    }

    public get actualPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.event.events.params.order )
    }

    public get pageLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.event.events.loading )
    }

    public get pageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.event.events.silentLoading )
    }

    public get pageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.event.events.error )
    }

    public get element (): Observable<EventModel | undefined> {
        return this.ngStore.select( (state: StateModel): EventModel | undefined => state.event.event.element )
    }

    public get elementLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.event.event.loading )
    }

    public get elementError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.event.event.error )
    }

    public startPageLoader (): void {
        this.ngStore.dispatch( StartEventsPageLoader )
    }

    public stopPageLoader (): void {
        this.ngStore.dispatch( StopEventsPageLoader )
    }

    public fetchPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchEventPage( offset, limit, force ) )
    }

    public inputPageSearch (search: string | undefined): void {
        this.ngStore.dispatch( new InputEventPageSearch( search ) )
    }

    public inputPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputEventPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectEventPageVisibility( onlyVisible ) )
    }

    public selectPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectEventPageOrder( order ) )
    }

    public startElementLoader (): void {
        this.ngStore.dispatch( StartEventLoader )
    }

    public stopElementLoader (): void {
        this.ngStore.dispatch( StopEventLoader )
    }

    public fetchElement (id: string): void {
        this.ngStore.dispatch( new FetchEvent( id ) )
    }

    public resetElement (): void {
        this.ngStore.dispatch( ResetEvent )
    }

    public createElement (event: EventDto): Observable<CreateEvent> {
        this.ngStore.dispatch( new CreateEvent( event ) )
        return this.actions$.pipe( ofActionSuccessful( CreateEvent ) )
    }

    public updateElement (id: string, event: EventDto): Observable<UpdateEvent> {
        this.ngStore.dispatch( new UpdateEvent( id, event ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateEvent ) )
    }

    public disableElement (id: string): void {
        this.ngStore.dispatch( new DisableEvent( id ) )
    }

    public enableElement (id: string): void {
        this.ngStore.dispatch( new EnableEvent( id ) )
    }

    public deleteElement (element: EventModel): void {
        this.ngStore.dispatch( new DeleteEvent( element ) )
    }
}
