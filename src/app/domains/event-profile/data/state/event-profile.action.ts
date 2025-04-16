import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { EventProfileDto } from '../dto/event-profile.dto'
import { EventProfilesDto } from '../dto/event-profiles.dto'
import { EventProfilePageParamsModel } from '../model/event-profile-page-params.model'

enum ActionEnum {
    START_EVENT_PROFILES_PAGE_LOADER = '[Local] Starting event profiles\' page loader',
    STOP_EVENT_PROFILES_PAGE_LOADER = '[Local] Stopping event profiles\' page loader',

    FETCH_EVENT_PROFILES_PAGE = '[Backend] Fetching event profiles\' page',
    UPDATE_EVENT_PROFILES_PAGE_SEARCH_PARAMS = '[Local] Updating event profiles\' page search params',

    START_EVENT_PROFILE_LOADER = '[Local] Starting event profile\'s loader',
    STOP_EVENT_PROFILE_LOADER = '[Local] Stopping event profile\'s loader',

    FETCH_EVENT_PROFILE = '[Backend] Fetching event profile',
    RESET_EVENT_PROFILE = '[Local] Resetting event profile',
    SEARCH_USERS = '[Backend] Searching users to invite',
    FETCH_ASSIGNABLE_EVENT_PROFILE_ROLES = '[Backend] Fetching assignable event profile\'s roles',
    FETCH_AVAILABLE_EVENT_PROFILE_STATUS = '[Backend] Fetching available event profile\'s status',
    CREATE_EVENT_PROFILES = '[Backend] Creating event profile',
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
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateEventProfilesPageSearchParams {
    public static readonly type: ActionEnum = ActionEnum.UPDATE_EVENT_PROFILES_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: EventProfilePageParamsModel) {}
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

export class ResetEventProfile {
    public static readonly type: ActionEnum = ActionEnum.RESET_EVENT_PROFILE
}

export class SearchUsers {
    public static readonly type: ActionEnum = ActionEnum.SEARCH_USERS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}

export class FetchAssignableEventProfileRoles {
    public static readonly type: ActionEnum = ActionEnum.FETCH_ASSIGNABLE_EVENT_PROFILE_ROLES

    public constructor (public readonly eventId: string | undefined) {}
}

export class FetchProfileStatus {
    public static readonly type: ActionEnum = ActionEnum.FETCH_AVAILABLE_EVENT_PROFILE_STATUS
}

export class CreateEventProfiles {
    public static readonly type: ActionEnum = ActionEnum.CREATE_EVENT_PROFILES

    public constructor (public readonly eventId: string | undefined, public readonly profiles: EventProfilesDto) {}
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
