import { Action, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { EventModel } from '../../../../shared/util-model/model/event.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericElementState } from '../../../../shared/util-tool/state/generic-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import { EventStateModel } from '../model/event-state.model'
import {
    CreateEvent,
    DeleteEvent,
    DisableEvent,
    EnableEvent,
    FetchEvent,
    FetchEventOptions,
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
import { EventService } from './event.service'
import { EventFacade } from './event.facade'
import { Injectable } from '@angular/core'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { EventOptionModel } from '../model/event-option.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'

const defaultEvent: ElementRequestInformationModel<EventModel> = {
    element: undefined,
    loading: false,
}

const defaultEventState: EventStateModel = {
    events: {
        element: undefined,
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            searched: undefined,
            startDate: undefined,
            endDate: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    event: defaultEvent,
    _metadata: {
        options: [],
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

    @Action( FetchEventPage )
    public fetchEventPage (ctx: StateContext<EventStateModel>, payload: FetchEventPage): Observable<void> {
        return this.service.findEvents( payload.offset, payload.limit, ctx.getState().events.params ).pipe(
            initialize( (): void => this.facade.startPageLoader() ),
            finalize( (): void => this.facade.stopPageLoader() ),
            map( (eventPage: PageModel<EventModel>): void => this.fetchEventPageComplete( ctx, eventPage ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchEventPageComplete (ctx: StateContext<EventStateModel>, eventPage: PageModel<EventModel>): void {
        ctx.patchState( {
            events: {
                ...ctx.getState().events,
                element: eventPage,
            },
        } )
    }

    @Action( InputEventPageSearch )
    public inputEventPageSearch (
        ctx: StateContext<EventStateModel>,
        payload: InputEventPageSearch,
    ): void {
        ctx.patchState( {
            events: {
                ...ctx.getState().events,
                params: {
                    ...ctx.getState().events.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputEventPageDateRange )
    public inputEventPageDateRange (
        ctx: StateContext<EventStateModel>,
        payload: InputEventPageDateRange,
    ): void {
        ctx.patchState( {
            events: {
                ...ctx.getState().events,
                params: {
                    ...ctx.getState().events.params,
                    startDate: payload.begin?.toISOString(),
                    endDate: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectEventPageVisibility )
    public selectEventPageVisibility (
        ctx: StateContext<EventStateModel>,
        payload: SelectEventPageVisibility,
    ): void {
        ctx.patchState( {
            events: {
                ...ctx.getState().events,
                params: {
                    ...ctx.getState().events.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectEventPageOrder )
    public selectEventPageOrder (
        ctx: StateContext<EventStateModel>,
        payload: SelectEventPageOrder,
    ): void {
        ctx.patchState( {
            events: {
                ...ctx.getState().events,
                params: {
                    ...ctx.getState().events.params,
                    order: payload.order,
                },
            },
        } )
    }

    @Action( FetchEventOptions )
    public fetchEventOptions (ctx: StateContext<EventStateModel>): Observable<void> {
        return this.service.getAvailableEventOptions().pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (options: EventOptionModel[]): void => this.fetchEventOptionsComplete( ctx, options ) ),
        )
    }

    private fetchEventOptionsComplete (ctx: StateContext<EventStateModel>, options: EventOptionModel[]): void {
        ctx.patchState( {
            _metadata: {
                options: options,
            },
        } )
    }

    @Action( FetchEvent )
    public fetchEvent (ctx: StateContext<EventStateModel>, payload: FetchEvent): Observable<void> {
        return this.service.findEventById( payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (event: EventModel): void => this.createEventComplete( ctx, event ) ),
        )
    }

    private createEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event.create',
            'success.message.event.create',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( UpdateEvent )
    public updateEvent (ctx: StateContext<EventStateModel>, payload: UpdateEvent): Observable<void> {
        return this.service.updateEventById( payload.id, payload.event ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (event: EventModel): void => this.updateEventComplete( ctx, event ) ),
        )
    }

    private updateEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event.edit',
            'success.message.event.edit',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.refreshPage( ctx )
    }

    @Action( DisableEvent )
    public disableEvent (ctx: StateContext<EventStateModel>, payload: DisableEvent): Observable<void> {
        return this.service.disableEventById( payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (event: EventModel): void => this.disableEventComplete( ctx, event ) ),
        )
    }

    private disableEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event.disable',
            'success.message.event.disable',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( EnableEvent )
    public enableEvent (ctx: StateContext<EventStateModel>, payload: EnableEvent): Observable<void> {
        return this.service.enableEventById( payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (event: EventModel): void => this.enableEventComplete( ctx, event ) ),
        )
    }

    private enableEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event.enable',
            'success.message.event.enable',
            this.eventIcon,
            this.buildTranslationArgs( event ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( DeleteEvent )
    public deleteEvent (ctx: StateContext<EventStateModel>, payload: DeleteEvent): Observable<void> {
        return this.service.deleteEventById( payload.event.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (): void => this.deleteEventComplete( ctx, payload.event ) ),
        )
    }

    private deleteEventComplete (ctx: StateContext<EventStateModel>, event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event.delete',
            'success.message.event.delete',
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
        this.facade.fetchPage( page?.offset, page?.limit, true )
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
