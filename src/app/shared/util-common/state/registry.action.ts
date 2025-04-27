import { ToastMessageOptions } from 'primeng/api'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { TokenModel } from '../../util-authentication/model/token.model'
import { ErrorModel } from '../../util-model/model/error.model'
import { EventModel } from '../../util-model/model/event.model'

export enum RegistryActionEnum {
    START_GLOBAL_LOADER = '[Local] Starting global loader',
    STOP_GLOBAL_LOADER = '[Local] Stopping global loader',

    SET_GLOBAL_ERROR = '[Local] Setting global error',

    UPDATE_NETWORK = '[Local] Updating network status',
    UPDATE_SCREEN_WIDTH = '[Local] Updating screen width',
    UPDATE_THEME = '[Local] Updating application theme',

    NOTIFY = '[Local] Notifying',
    ACK_NOTIFICATION = '[Local] Acknowledging notification',

    LOGIN = '[Backend] Logging in',
    LOGOUT = '[Backend] Logging out',

    RESTORE_TOKENS = '[Local] Restoring tokens',
    FETCH_TOKENS = '[Backend] Fetching tokens',
    REFRESH_TOKENS = '[Backend] Refreshing tokens',

    FETCH_CURRENT_USER = '[Backend] Fetching current user',
    IMPERSONATE_CURRENT_USER = '[Backend] Impersonating current user',

    START_USER_EVENT_PROFILES_PAGE_LOADER = '[Local] Starting user event profiles\' page loader',
    STOP_USER_EVENT_PROFILES_PAGE_LOADER = '[Local] Stopping user event profiles\' page loader',

    FETCH_USER_EVENT_PROFILES_PAGE = '[Backend] Fetching user event profiles\' page',
    UPDATE_USER_EVENT_PROFILES_PAGE_SEARCH_PARAMS = '[Local] Updating user event profiles\' page search params',

    START_USER_EVENT_PROFILE_INVITATIONS_PAGE_LOADER = '[Local] Starting user event profile invitations\' page loader',
    STOP_USER_EVENT_PROFILE_INVITATIONS_PAGE_LOADER = '[Local] Stopping user event profile invitations\' page loader',

    FETCH_USER_EVENT_PROFILE_INVITATIONS_PAGE = '[Backend] Fetching user event profile invitations\' page',
    UPDATE_USER_EVENT_PROFILE_INVITATIONS_PAGE_SEARCH_PARAMS = '[Local] Updating user event profile invitations\' page search params',

    START_USER_EVENT_PROFILE_LOADER = '[Local] Starting user event profile loader',
    STOP_USER_EVENT_PROFILE_LOADER = '[Local] Stopping user event profile loader',

    MANAGE_USER_EVENT_INVITATION_ACCEPTANCE = '[Backend] Managing user event invitation acceptance',
    SELECT_USER_EVENT_PROFILE = '[Backend] Selecting user event profile',
    SELECT_USER_EVENT_PROFILE_BY_EVENT = '[Backend] Selecting user event profile by event',
    DELETE_USER_EVENT_PROFILE = '[Backend] Deleting user event profile',

    CREATE_SUPPORT_EVENT_PROFILE = '[Backend] Creating event profiles',
}

export class StartGlobalLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_GLOBAL_LOADER
}

export class StopGlobalLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_GLOBAL_LOADER
}

export class SetGlobalError {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.SET_GLOBAL_ERROR

    public constructor (public readonly error: ErrorModel) {}
}

export class UpdateNetwork {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_NETWORK

    public constructor (public readonly online: boolean) {}
}

export class UpdateScreenWidth {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_SCREEN_WIDTH

    public constructor (public readonly screenWidth: number) {}
}

export class UpdateTheme {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_THEME

    public constructor (public readonly theme: 'light' | 'dark') {}
}

export class Notify {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.NOTIFY

    public constructor (public readonly message: ToastMessageOptions) {}
}

export class AckNotification {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.ACK_NOTIFICATION
}

export class Login {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.LOGIN
}

export class Logout {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.LOGOUT
}

export class RestoreTokens {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.RESTORE_TOKENS

    public constructor (public readonly token: TokenModel) {}
}

export class FetchTokens {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.FETCH_TOKENS

    public constructor (public readonly authorizationCode: string) {}
}

export class RefreshTokens {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.REFRESH_TOKENS
}

export class FetchCurrentUser {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.FETCH_CURRENT_USER
}

export class ImpersonateCurrentUser {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.IMPERSONATE_CURRENT_USER
}

export class StartUserEventProfilesPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_USER_EVENT_PROFILES_PAGE_LOADER
}

export class StopUserEventProfilesPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_USER_EVENT_PROFILES_PAGE_LOADER
}

export class FetchUserEventProfilesPage {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.FETCH_USER_EVENT_PROFILES_PAGE

    public constructor (
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateUserEventProfilesPageSearchParams {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_USER_EVENT_PROFILES_PAGE_SEARCH_PARAMS

    public constructor (
        public readonly resetSearch: boolean,
        public readonly textSearched: string | undefined,
        public readonly dateTimeSearched: string | undefined,
    ) {}
}

export class StartUserEventProfileInvitationsPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_USER_EVENT_PROFILE_INVITATIONS_PAGE_LOADER
}

export class StopUserEventProfileInvitationsPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_USER_EVENT_PROFILE_INVITATIONS_PAGE_LOADER
}

export class FetchUserEventProfileInvitationsPage {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.FETCH_USER_EVENT_PROFILE_INVITATIONS_PAGE

    public constructor (
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateUserEventProfileInvitationsPageSearchParams {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_USER_EVENT_PROFILE_INVITATIONS_PAGE_SEARCH_PARAMS

    public constructor (
        public readonly resetSearch: boolean,
        public readonly textSearched: string | undefined,
        public readonly dateTimeSearched: string | undefined,
    ) {}
}

export class StartUserEventProfileLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_USER_EVENT_PROFILE_LOADER
}

export class StopUserEventProfileLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_USER_EVENT_PROFILE_LOADER
}

export class ManageUserEventInvitationAcceptance {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.MANAGE_USER_EVENT_INVITATION_ACCEPTANCE

    public constructor (public readonly profileId: string, public readonly accepted: boolean) {}
}

export class SelectUserEventProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.SELECT_USER_EVENT_PROFILE

    public constructor (public readonly profile: EventProfileModel) {}
}

export class SelectUserEventProfileByEvent {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.SELECT_USER_EVENT_PROFILE_BY_EVENT

    public constructor (public readonly event: EventModel) {}
}

export class DeleteUserEventProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.DELETE_USER_EVENT_PROFILE

    public constructor (public readonly profile: EventProfileModel) {}
}

export class CreateSupportEventProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.CREATE_SUPPORT_EVENT_PROFILE

    public constructor (public readonly eventId: string) {}
}
