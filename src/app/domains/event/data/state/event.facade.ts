import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericFacade } from '../../../../shared/util-tool/facade/generic.facade'
import { EventState } from './event.state'
import {
    CreateEvent,
    DeleteEvent,
    DisableEvent,
    EnableEvent,
    FetchEvent,
    FetchEventOptions,
    FetchEventsPage,
    InputEventsPageDateTimeSearched,
    InputEventsPageTextSearched,
    ResetEvent,
    SelectEventsPageVisibilitySearched,
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
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

@Injectable()
export class EventFacade extends GenericFacade {
    public get eventsPage (): Signal<PageModel<EventModel> | undefined> {
        return this.ngStore.selectSignal( EventState.eventsPage )
    }

    public get eventsPageLoading (): Signal<boolean> {
        return computed( (): boolean => this.ngStore.selectSignal( EventState.eventsPageLoading )() )
    }

    public get eventsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( EventState.eventsPageSilentLoading )
    }

    public get eventsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( EventState.eventsPageError )
    }

    public get eventsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( EventState.eventsPageTextSearchedParam )
    }

    public get eventsPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined => DateUtil.buildDate( this.ngStore.selectSignal( EventState.eventsPageDateTimeSearchedParam )() ) )
    }

    public get eventsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( EventState.eventsPageVisibilitySearchedParam )
    }

    public get eventOptionsMetadata (): Signal<EventOptionModel[]> {
        return this.ngStore.selectSignal( EventState.eventOptionsMetadata )
    }

    public get eventOptionsMetadata$ (): Observable<EventOptionModel[]> {
        return this.ngStore.select( EventState.eventOptionsMetadata )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( EventState.visibilitiesMetadata )().map( (item: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...item,
                label: this.translateService.instant( item.label! ),
            }) ),
        )
    }

    public get event (): Signal<EventModel | undefined> {
        return this.ngStore.selectSignal( EventState.event )
    }

    public get event$ (): Observable<EventModel | undefined> {
        return this.ngStore.select( EventState.event )
    }

    public get eventLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( EventState.eventLoading )
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
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchEventsPage( pageNumber, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (textSearched !== this.eventsPageTextSearchedParam()) {
            this.ngStore.dispatch( new InputEventsPageTextSearched( textSearched ) )
        }

        if (dateTimeSearched !== this.eventsPageDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputEventsPageDateTimeSearched( dateTimeSearched ) )
        }

        if (visibilitySearched !== this.eventsPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectEventsPageVisibilitySearched( visibilitySearched ) )
        }
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
