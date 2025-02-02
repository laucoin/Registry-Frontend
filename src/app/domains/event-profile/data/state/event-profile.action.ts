import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { EventProfileDto } from '../dto/event-profile.dto'
import { EventProfilesDto } from '../dto/event-profiles.dto'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

enum ActionEnum {
    START_EVENT_PROFILES_PAGE_LOADER = '[Local] Starting event profiles\' page loader',
    STOP_EVENT_PROFILES_PAGE_LOADER = '[Local] Stopping event profiles\' page loader',

    FETCH_EVENT_PROFILES_PAGE = '[Backend] Fetching event profiles\' page',
    INPUT_EVENT_PROFILES_PAGE_SEARCH = '[Local] Inputting event profiles\' page search',
    INPUT_EVENT_PROFILES_PAGE_DATE_RANGE = '[Local] Inputting event profiles\' page date range',
    SELECT_EVENT_PROFILES_PAGE_STATUS = '[Local] Inputting event profiles\' page status',
    SELECT_EVENT_PROFILES_PAGE_VISIBILITY = '[Local] Selecting event profiles\' page visibility',
    SELECT_EVENT_PROFILES_PAGE_ORDER = '[Local] Selecting event profiles\' page order',

    START_EVENT_PROFILE_LOADER = '[Local] Starting event profile\'s loader',
    STOP_EVENT_PROFILE_LOADER = '[Local] Stopping event profile\'s loader',

    FETCH_EVENT_PROFILE = '[Backend] Fetching event profile',
    SEARCH_USERS = '[Backend] Searching users to invite',
    FETCH_ASSIGNABLE_EVENT_PROFILE_ROLES = '[Backend] Fetching assignable event profile\'s roles',
    FETCH_AVAILABLE_EVENT_PROFILE_STATUS = '[Backend] Fetching available event profile\'s status',
    CREATE_EVENT_PROFILES = '[Backend] Creating event profile',
    CREATE_SUPPORT_EVENT_PROFILE = '[Backend] Creating event profiles',
    UPDATE_EVENT_PROFILE = '[Backend] Updating event profile',
    BLOCK_EVENT_PROFILE = '[Backend] Blocking event profile',
    UNBLOCK_EVENT_PROFILE = '[Backend] Unblocking event profile',
    DELETE_EVENT_PROFILE = '[Backend] Deleting event profile',
}

export class StartEventProfilesPageLoader {
    public static readonly type: ActionEnum = ActionEnum.START_EVENT_PROFILES_PAGE_LOADER
}

export class StopEventProfilesPageLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_EVENT_PROFILES_PAGE_LOADER
}

export class FetchEventProfilesPage {
    public static readonly type: ActionEnum = ActionEnum.FETCH_EVENT_PROFILES_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputEventProfilesPageSearch {
    public static readonly type: ActionEnum = ActionEnum.INPUT_EVENT_PROFILES_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputEventProfilesPageDateRange {
    public static readonly type: ActionEnum = ActionEnum.INPUT_EVENT_PROFILES_PAGE_DATE_RANGE

    public constructor (
        public readonly begin: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectEventProfilesPageStatus {
    public static readonly type: ActionEnum = ActionEnum.SELECT_EVENT_PROFILES_PAGE_STATUS

    public constructor (public readonly status: string | undefined) {}
}

export class SelectEventProfilesPageVisibility {
    public static readonly type: ActionEnum = ActionEnum.SELECT_EVENT_PROFILES_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectEventProfilesPageOrder {
    public static readonly type: ActionEnum = ActionEnum.SELECT_EVENT_PROFILES_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class StartEventProfileLoader {
    public static readonly type: ActionEnum = ActionEnum.START_EVENT_PROFILE_LOADER
}

export class StopEventProfileLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_EVENT_PROFILE_LOADER
}

export class FetchEventProfile {
    public static readonly type: ActionEnum = ActionEnum.FETCH_EVENT_PROFILE

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class SearchUsers {
    public static readonly type: ActionEnum = ActionEnum.SEARCH_USERS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly searched: string | undefined,
    ) {}
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
