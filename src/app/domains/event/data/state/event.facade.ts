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
    ResetEvent,
    StartEventLoader,
    StartEventsPageLoader,
    StopEventLoader,
    StopEventsPageLoader,
    UpdateEvent,
    UpdateEventsPageSearchParams,
} from './event.action'
import { EventDto } from '../dto/event.dto'
import { ActionCompletion, ofActionCompleted, ofActionSuccessful } from '@ngxs/store'
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

    private get eventsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( EventState.eventsPageResetSearch )
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
        const index: number | undefined = this.eventsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchEventsPage( index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.eventsPageTextSearchedParam() != textSearched
                                     || this.eventsPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.eventsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateEventsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } ) )
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

    public disableEvent (id: string): Observable<ActionCompletion<DisableEvent>> {
        this.ngStore.dispatch( new DisableEvent( id ) )

        return this.actions$.pipe( ofActionCompleted( DisableEvent ) )
    }

    public enableEvent (id: string): Observable<ActionCompletion<EnableEvent>> {
        this.ngStore.dispatch( new EnableEvent( id ) )

        return this.actions$.pipe( ofActionCompleted( EnableEvent ) )
    }

    public deleteEvent (element: EventModel): Observable<ActionCompletion<DeleteEvent>> {
        this.ngStore.dispatch( new DeleteEvent( element ) )

        return this.actions$.pipe( ofActionCompleted( DeleteEvent ) )
    }
}
