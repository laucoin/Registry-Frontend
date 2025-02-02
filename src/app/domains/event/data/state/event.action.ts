import { EventModel } from '../../../../shared/util-model/model/event.model'
import { EventDto } from '../dto/event.dto'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

export enum EventActionEnum {
    FETCH_EVENT_OPTIONS = '[Backend] Fetching event\'s options',

    START_EVENTS_PAGE_LOADER = '[Local] Starting events\' page loader',
    STOP_EVENTS_PAGE_LOADER = '[Local] Stopping events\' page loader',

    FETCH_EVENTS_PAGE = '[Backend] Fetching events\' page',
    INPUT_EVENTS_PAGE_SEARCH = '[Local] Inputting events\' page search',
    INPUT_EVENTS_PAGE_DATE_RANGE = '[Local] Inputting events\' page date range',
    SELECT_EVENTS_PAGE_VISIBILITY = '[Local] Selecting events\' page visibility',
    SELECT_EVENTS_PAGE_ORDER = '[Local] Selecting events\' page order',

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
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputEventsPageSearch {
    public static readonly type: EventActionEnum = EventActionEnum.INPUT_EVENTS_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputEventsPageDateRange {
    public static readonly type: EventActionEnum = EventActionEnum.INPUT_EVENTS_PAGE_DATE_RANGE

    public constructor (
        public readonly begin: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectEventsPageVisibility {
    public static readonly type: EventActionEnum = EventActionEnum.SELECT_EVENTS_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectEventsPageOrder {
    public static readonly type: EventActionEnum = EventActionEnum.SELECT_EVENTS_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
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
