import { EventModel } from '../../../../shared/util-model/model/event.model'
import { EventDto } from '../dto/event.dto'
import { EventPageParamsModel } from '../model/event-page-params.model'

export enum EventActionEnum {
    FETCH_EVENT_OPTIONS = '[Backend] Fetching event\'s options',

    START_EVENTS_PAGE_LOADER = '[Local] Starting events\' page loader',
    STOP_EVENTS_PAGE_LOADER = '[Local] Stopping events\' page loader',

    FETCH_EVENTS_PAGE = '[Backend] Fetching events\' page',
    UPDATE_EVENTS_PAGE_SEARCH_PARAMS = '[Local] Updating events\' page search params',

    START_EVENT_LOADER = '[Local] Starting event loader',
    STOP_EVENT_LOADER = '[Local] Stopping event loader',

    FETCH_EVENT = '[Backend] Fetching event',
    RESET_EVENT = '[Local] Resetting event',
    CREATE_EVENT = '[Backend] Creating event',
    UPDATE_EVENT = '[Backend] Updating event',
    DISABLE_EVENT = '[Backend] Disabling event',
    ENABLE_EVENT = '[Backend] Enabling event',
    DELETE_EVENT = '[Backend] Deleting event',
}

export class FetchEventOptions {
    public static readonly type: EventActionEnum = EventActionEnum.FETCH_EVENT_OPTIONS
}

export class StartEventsPageLoader {
    public static readonly type: EventActionEnum = EventActionEnum.START_EVENTS_PAGE_LOADER
}

export class StopEventsPageLoader {
    public static readonly type: EventActionEnum = EventActionEnum.STOP_EVENTS_PAGE_LOADER
}

export class FetchEventsPage {
    public static readonly type: EventActionEnum = EventActionEnum.FETCH_EVENTS_PAGE

    public constructor (
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateEventsPageSearchParams {
    public static readonly type: EventActionEnum = EventActionEnum.UPDATE_EVENTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: EventPageParamsModel) {}
}

export class StartEventLoader {
    public static readonly type: EventActionEnum = EventActionEnum.START_EVENT_LOADER
}

export class StopEventLoader {
    public static readonly type: EventActionEnum = EventActionEnum.STOP_EVENT_LOADER
}

export class FetchEvent {
    public static readonly type: EventActionEnum = EventActionEnum.FETCH_EVENT

    public constructor (public readonly id: string) {}
}

export class ResetEvent {
    public static readonly type: EventActionEnum = EventActionEnum.RESET_EVENT
}

export class CreateEvent {
    public static readonly type: EventActionEnum = EventActionEnum.CREATE_EVENT

    public constructor (public readonly event: EventDto) {}
}

export class UpdateEvent {
    public static readonly type: EventActionEnum = EventActionEnum.UPDATE_EVENT

    public constructor (public readonly id: string, public readonly event: EventDto) {}
}

export class DisableEvent {
    public static readonly type: EventActionEnum = EventActionEnum.DISABLE_EVENT

    public constructor (public readonly id: string) {}
}

export class EnableEvent {
    public static readonly type: EventActionEnum = EventActionEnum.ENABLE_EVENT

    public constructor (public readonly id: string) {}
}

export class DeleteEvent {
    public static readonly type: EventActionEnum = EventActionEnum.DELETE_EVENT

    public constructor (public readonly event: EventModel) {}
}
