import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericElementState } from '../../../../shared/util-tool/state/generic-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
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
import { EventService } from './event.service'
import { EventFacade } from './event.facade'
import { Injectable } from '@angular/core'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { EventOptionModel } from '../model/event-option.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { EventModel } from '../../../../shared/util-model/model/event.model'
import { EventStateModel } from '../model/event-state.model'

const defaultEvent: ElementRequestInformationModel<EventModel> = {
    element: undefined,
    loading: false,
}

const defaultEventState: EventStateModel = {
    events: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            visibilitySearched: undefined,
            dateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    event: defaultEvent,
    _metadata: {
        options: [],
        visibilities: [
            {
                label: '-',
                value: undefined,
            },
            {
                label: 'events.visible.true',
                value: true,
            },
            {
                label: 'events.visible.false',
                value: false,
            },
        ],
    },
}

@State<EventStateModel>( {
    name: 'event',
    defaults: defaultEventState,
} )
@Injectable()
export class EventState extends GenericElementState<EventStateModel> {
    private readonly eventIcon: string = 'pi pi-calendar'

    public constructor (
        private readonly service: EventService,
        private readonly facade: EventFacade,
    ) {
        super()
    }

    @Selector()
    public static eventsPage (state: EventStateModel): PageModel<EventModel> | undefined {
        return state.events.element
    }

    @Selector()
    public static eventsPageLoading (state: EventStateModel): boolean {
        return state.events.loading
    }

    @Selector()
    public static eventsPageError (state: EventStateModel): ToastMessageOptions | undefined {
        return state.events.error
    }

    @Selector()
    public static eventsPageSilentLoading (state: EventStateModel): boolean {
        return state.events.silentLoading
    }

    @Selector()
    public static eventsPageResetSearch (state: EventStateModel): boolean {
        return state.events.params.resetSearch
    }

    @Selector()
    public static eventsPageTextSearchedParam (state: EventStateModel): string | undefined {
        return state.events.params.textSearched
    }

    @Selector()
    public static eventsPageDateTimeSearchedParam (state: EventStateModel): string | undefined {
        return state.events.params.dateTimeSearched
    }

    @Selector()
    public static eventsPageVisibilitySearchedParam (state: EventStateModel): boolean | undefined {
        return state.events.params.visibilitySearched
    }

    @Selector()
    public static event (state: EventStateModel): EventModel | undefined {
        return state.event.element
    }

    @Selector()
    public static eventLoading (state: EventStateModel): boolean {
        return state.event.loading
    }

    @Selector()
    public static eventOptionsMetadata (state: EventStateModel): EventOptionModel[] {
        return state._metadata.options
    }

    @Selector()
    public static visibilitiesMetadata (state: EventStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( FetchEventOptions )
    public fetchEventOptions (ctx: StateContext<EventStateModel>): Observable<void> {
        return this.service.getAvailableEventOptions().pipe(
            map( (options: EventOptionModel[]): void => this.fetchEventOptionsComplete( ctx, options ) ),
        )
    }

    private fetchEventOptionsComplete (ctx: StateContext<EventStateModel>, options: EventOptionModel[]): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                options: options,
            },
        } )
    }

    @Action( StartEventsPageLoader )
    public startEventsPageLoader (ctx: StateContext<EventStateModel>): void {
        ctx.patchState( {
            events: StateUtil.updatePageLoader( ctx.getState().events, true ),
        } )
    }

    @Action( StopEventsPageLoader )
    public stopEventsPageLoader (ctx: StateContext<EventStateModel>): void {
        ctx.patchState( {
            events: StateUtil.updatePageLoader( ctx.getState().events, false ),
        } )
    }

    @Action( FetchEventsPage )
    public fetchEventsPage (ctx: StateContext<EventStateModel>, payload: FetchEventsPage): Observable<void> {
        return this.service.findEvents( payload.pageNumber, payload.pageSize, ctx.getState().events.params ).pipe(
            initialize( (): void => this.facade.startEventsPageLoader() ),
            finalize( (): void => this.facade.stopEventsPageLoader() ),
            map( (eventPage: PageModel<EventModel>): void => this.fetchEventsPageComplete( ctx, eventPage ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchEventsPageComplete (ctx: StateContext<EventStateModel>, eventPage: PageModel<EventModel>): void {
        ctx.patchState( {
            events: {
                ...ctx.getState().events,
                params: {
                    ...ctx.getState().events.params,
                    resetSearch: false,
                },
                element: eventPage,
            },
        } )
    }

    @Action( UpdateEventsPageSearchParams )
    public updateEventsPageSearchParams (
        ctx: StateContext<EventStateModel>,
        payload: UpdateEventsPageSearchParams,
    ): void {
        ctx.patchState( {
            events: {
                ...ctx.getState().events,
                params: payload.params,
            },
        } )
    }

    @Action( StartEventLoader )
    public startEventLoader (ctx: StateContext<EventStateModel>): void {
        ctx.patchState( {
            event: StateUtil.updateElementLoader( ctx.getState().event, true ),
        } )
    }

    @Action( StopEventLoader )
    public stopEventLoader (ctx: StateContext<EventStateModel>): void {
        ctx.patchState( {
            event: StateUtil.updateElementLoader( ctx.getState().event, false ),
        } )
    }

    @Action( FetchEvent )
    public fetchEvent (ctx: StateContext<EventStateModel>, payload: FetchEvent): Observable<void> {
        return this.service.findEventById( payload.id ).pipe(
            initialize( (): void => this.facade.startEventLoader() ),
            finalize( (): void => this.facade.stopEventLoader() ),
            map( (event: EventModel): void => this.fetchEventComplete( ctx, event ) ),
        )
    }

    private fetchEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        ctx.patchState( {
            event: {
                ...ctx.getState().event,
                element: event,
            },
        } )
    }

    @Action( ResetEvent )
    public resetEvent (ctx: StateContext<EventStateModel>): void {
        ctx.patchState( {
            event: defaultEvent,
        } )
    }

    @Action( CreateEvent )
    public createEvent (ctx: StateContext<EventStateModel>, payload: CreateEvent): Observable<void> {
        return this.service.createEvent( payload.event ).pipe(
            initialize( (): void => this.facade.startEventLoader() ),
            finalize( (): void => this.facade.stopEventLoader() ),
            map( (event: EventModel): void => this.createEventComplete( ctx, event ) ),
        )
    }

    private createEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'events.notifications.create.title',
            'events.notifications.create.message',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( UpdateEvent )
    public updateEvent (ctx: StateContext<EventStateModel>, payload: UpdateEvent): Observable<void> {
        return this.service.updateEventById( payload.id, payload.event ).pipe(
            initialize( (): void => this.facade.startEventLoader() ),
            finalize( (): void => this.facade.stopEventLoader() ),
            map( (event: EventModel): void => this.updateEventComplete( ctx, event ) ),
        )
    }

    private updateEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'events.notifications.edit.title',
            'events.notifications.edit.message',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )

        if (this.registryFacade.currentUser()?.preferences.selectedProfile?.event?.id == event.id) {
            this.registryFacade.fetchCurrentUser()
        }

        this.refreshPage( ctx )
    }

    @Action( DisableEvent )
    public disableEvent (ctx: StateContext<EventStateModel>, payload: DisableEvent): Observable<void> {
        return this.service.disableEventById( payload.id ).pipe(
            initialize( (): void => this.facade.startEventLoader() ),
            finalize( (): void => this.facade.stopEventLoader() ),
            map( (event: EventModel): void => this.disableEventComplete( ctx, event ) ),
        )
    }

    private disableEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'events.notifications.disable.title',
            'events.notifications.disable.message',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( EnableEvent )
    public enableEvent (ctx: StateContext<EventStateModel>, payload: EnableEvent): Observable<void> {
        return this.service.enableEventById( payload.id ).pipe(
            initialize( (): void => this.facade.startEventLoader() ),
            finalize( (): void => this.facade.stopEventLoader() ),
            map( (event: EventModel): void => this.enableEventComplete( ctx, event ) ),
        )
    }

    private enableEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'events.notifications.enable.title',
            'events.notifications.enable.message',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( DeleteEvent )
    public deleteEvent (ctx: StateContext<EventStateModel>, payload: DeleteEvent): Observable<void> {
        return this.service.deleteEventById( payload.event.id ).pipe(
            initialize( (): void => this.facade.startEventLoader() ),
            finalize( (): void => this.facade.stopEventLoader() ),
            map( (): void => this.deleteEventComplete( ctx, payload.event ) ),
        )
    }

    private deleteEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'events.notifications.delete.title',
            'events.notifications.delete.message',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (event: EventModel): object {
        return { name: event.name }
    }

    protected refreshPage (ctx: StateContext<EventStateModel>): void {
        const page: PageModel<EventModel> | undefined = ctx.getState().events.element
        this.facade.fetchEventsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<EventStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                events: this.buildErrorMessage( ctx.getState().events, error ),
            } )
        }

        return of()
    }
}
