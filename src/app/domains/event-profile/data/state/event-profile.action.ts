import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { EventProfileDto } from '../dto/event-profile.dto'
import { EventProfilesDto } from '../dto/event-profiles.dto'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

enum ActionEnum {
    START_EVENT_PROFILES_PAGE_LOADER = '[Local] Starting event profile\'s page loader',
    STOP_EVENT_PROFILES_PAGE_LOADER = '[Local] Stopping event profile\'s page loader',

    START_EVENT_PROFILE_LOADER = '[Local] Starting event profile\'s loader',
    STOP_EVENT_PROFILE_LOADER = '[Local] Stopping event profile\'s loader',

    FETCH_EVENT_PROFILE_PAGE = '[Backend] Fetching event\'s profile page',
    INPUT_EVENT_PROFILE_PAGE_SEARCH = '[Local] Inputting event\'s profile page search',
    INPUT_EVENT_PROFILE_PAGE_DATE_RANGE = '[Local] Inputting event\'s profile page date range',
    SELECT_EVENT_PROFILE_PAGE_STATUS = '[Local] Inputting event\'s profile page status',
    SELECT_EVENT_PROFILE_PAGE_VISIBILITY = '[Local] Selecting event\'s profile page visibility',
    SELECT_EVENT_PROFILE_PAGE_ORDER = '[Local] Selecting event\'s profile page order',

    SEARCH_USERS = '[Backend] Searching users to invite to an event',

    FETCH_EVENT_PROFILE = '[Backend] Fetching event\'s profile',
    FETCH_ASSIGNABLE_EVENT_PROFILE_ROLES = '[Backend] Fetching assignable event profile\'s roles',
    FETCH_AVAILABLE_EVENT_PROFILE_STATUS = '[Backend] Fetching available event profile\'s status',
    CREATE_EVENT_PROFILES = '[Backend] Creating event\'s profile',
    CREATE_SUPPORT_EVENT_PROFILE = '[Backend] Creating event\'s profiles',
    UPDATE_EVENT_PROFILE = '[Backend] Updating event\'s profile',
    BLOCK_EVENT_PROFILE = '[Backend] Blocking event\'s profile',
    UNBLOCK_EVENT_PROFILE = '[Backend] Unblocking event\'s profile',
    DELETE_EVENT_PROFILE = '[Backend] Deleting event\'s profile',
}

export class StartEventProfilesPageLoader {
    public static readonly type: ActionEnum = ActionEnum.START_EVENT_PROFILES_PAGE_LOADER
}

export class StopEventProfilesPageLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_EVENT_PROFILES_PAGE_LOADER
}

export class StartEventProfileLoader {
    public static readonly type: ActionEnum = ActionEnum.START_EVENT_PROFILE_LOADER
}

export class StopEventProfileLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_EVENT_PROFILE_LOADER
}

export class FetchEventProfilePage {
    public static readonly type: ActionEnum = ActionEnum.FETCH_EVENT_PROFILE_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputEventProfilePageSearch {
    public static readonly type: ActionEnum = ActionEnum.INPUT_EVENT_PROFILE_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputEventProfilePageDateRange {
    public static readonly type: ActionEnum = ActionEnum.INPUT_EVENT_PROFILE_PAGE_DATE_RANGE

    public constructor (
        public readonly begin: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectEventProfilePageStatus {
    public static readonly type: ActionEnum = ActionEnum.SELECT_EVENT_PROFILE_PAGE_STATUS

    public constructor (public readonly status: string | undefined) {}
}

export class SelectEventProfilePageVisibility {
    public static readonly type: ActionEnum = ActionEnum.SELECT_EVENT_PROFILE_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectEventProfilePageOrder {
    public static readonly type: ActionEnum = ActionEnum.SELECT_EVENT_PROFILE_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class SearchUsers {
    public static readonly type: ActionEnum = ActionEnum.SEARCH_USERS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly searched: string | undefined,
    ) {}
}

export class FetchEventProfile {
    public static readonly type: ActionEnum = ActionEnum.FETCH_EVENT_PROFILE

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class FetchAssignableEventProfileRoles {
    public static readonly type: ActionEnum = ActionEnum.FETCH_ASSIGNABLE_EVENT_PROFILE_ROLES

    public constructor (public readonly eventId: string | undefined) {}
}

export class FetchAssignableEventProfileStatus {
    public static readonly type: ActionEnum = ActionEnum.FETCH_AVAILABLE_EVENT_PROFILE_STATUS

    public constructor (public readonly eventId: string | undefined) {}
}

export class CreateEventProfiles {
    public static readonly type: ActionEnum = ActionEnum.CREATE_EVENT_PROFILES

    public constructor (public readonly eventId: string | undefined, public readonly profiles: EventProfilesDto) {}
}

export class CreateSupportEventProfile {
    public static readonly type: ActionEnum = ActionEnum.CREATE_SUPPORT_EVENT_PROFILE

    public constructor (public readonly eventId: string | undefined) {}
}

export class UpdateEventProfile {
    public static readonly type: ActionEnum = ActionEnum.UPDATE_EVENT_PROFILE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly profile: EventProfileDto,
    ) {}
}

export class BlockEventProfile {
    public static readonly type: ActionEnum = ActionEnum.BLOCK_EVENT_PROFILE

    public constructor (public readonly eventId: string | undefined, public readonly profile: EventProfileModel) {}
}

export class UnblockEventProfile {
    public static readonly type: ActionEnum = ActionEnum.UNBLOCK_EVENT_PROFILE

    public constructor (public readonly eventId: string | undefined, public readonly profile: EventProfileModel) {}
}

export class DeleteEventProfile {
    public static readonly type: ActionEnum = ActionEnum.DELETE_EVENT_PROFILE

    public constructor (public readonly eventId: string | undefined, public readonly profile: EventProfileModel) {}
}
