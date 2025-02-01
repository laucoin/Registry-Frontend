import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ToastMessageOptions } from 'primeng/api'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { GenericFacade } from '../../../../shared/util-tool/facade/generic.facade'
import { EventState } from './event.state'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import {
    CreateEvent,
    DeleteEvent,
    DisableEvent,
    EnableEvent,
    FetchEvent,
    FetchEventOptions,
    FetchEventsPage,
    InputEventsPageDateRange,
    InputEventsPageSearch,
    ResetEvent,
    SelectEventsPageOrder,
    SelectEventsPageVisibility,
    StartEventLoader,
    StartEventsPageLoader,
    StopEventLoader,
    StopEventsPageLoader,
    UpdateEvent,
} from './event.action'
import { EventDto } from '../dto/event.dto'
import { ofActionSuccessful } from '@ngxs/store'
import { EventModel } from '../../../../shared/util-model/model/event.model'
import { EventOptionModel } from '../model/event-option.model'

@Injectable()
export class EventFacade extends GenericFacade {
    public get eventOptionsMetadata (): Observable<EventOptionModel[]> {
        return this.ngStore.select( EventState.eventOptionsMetadata )
    }

    public get eventsPage (): Observable<PageModel<EventModel> | undefined> {
        return this.ngStore.select( EventState.eventsPage )
    }

    public get eventsPageLoading (): Observable<boolean> {
        return this.ngStore.select( EventState.eventsPageLoading )
    }

    public get eventsPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( EventState.eventsPageSilentLoading )
    }

    public get eventsPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( EventState.eventsPageError )
    }

    public get actualEventsPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( EventState.eventsPageSearchParam )
    }

    public get actualEventsPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( EventState.eventsPageStartDateParam ),
            this.ngStore.selectSnapshot( EventState.eventsPageEndDateParam ),
        )
    }

    public get actualEventsPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( EventState.eventsPageOnlyVisibleParam )
    }

    public get actualEventsPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( EventState.eventsPageOrderParam )
    }

    public get event (): Observable<EventModel | undefined> {
        return this.ngStore.select( EventState.event )
    }

    public get eventLoading (): Observable<boolean> {
        return this.ngStore.select( EventState.eventLoading )
    }

    public fetchEventOptions (): void {
        this.ngStore.dispatch( FetchEventOptions )
    }

    public startEventsPageLoader (): void {
        this.ngStore.dispatch( StartEventsPageLoader )
    }

    public stopEventsPageLoader (): void {
        this.ngStore.dispatch( StopEventsPageLoader )
    }

    public fetchEventsPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchEventsPage( offset, limit, force ) )
    }

    public inputEventsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputEventsPageSearch( searched ) )
    }

    public inputEventsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputEventsPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectEventsPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectEventsPageVisibility( onlyVisible ) )
    }

    public selectEventsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectEventsPageOrder( order ) )
    }

    public startEventLoader (): void {
        this.ngStore.dispatch( StartEventLoader )
    }

    public stopEventLoader (): void {
        this.ngStore.dispatch( StopEventLoader )
    }

    public fetchEvent (id: string): void {
        this.ngStore.dispatch( new FetchEvent( id ) )
    }

    public resetEvent (): void {
        this.ngStore.dispatch( ResetEvent )
    }

    public createEvent (event: EventDto): Observable<CreateEvent> {
        this.ngStore.dispatch( new CreateEvent( event ) )
        return this.actions$.pipe( ofActionSuccessful( CreateEvent ) )
    }

    public updateEvent (
        id: string,
        event: EventDto,
    ): Observable<UpdateEvent> {
        this.ngStore.dispatch( new UpdateEvent( id, event ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateEvent ) )
    }

    public disableEvent (id: string): void {
        this.ngStore.dispatch( new DisableEvent( id ) )
    }

    public enableEvent (id: string): void {
        this.ngStore.dispatch( new EnableEvent( id ) )
    }

    public deleteEvent (element: EventModel): void {
        this.ngStore.dispatch( new DeleteEvent( element ) )
    }
}
