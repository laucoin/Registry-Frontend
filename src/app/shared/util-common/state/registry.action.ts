import { ToastMessageOptions } from 'primeng/api'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { OrderEnum } from '../../util-model/enumeration/order.enum'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { HttpErrorResponse } from '@angular/common/http'

enum ActionEnum {
    START_GLOBAL_LOADER = '[Local] Starting global loader',
    STOP_GLOBAL_LOADER = '[Local] Stopping global loader',

    UPDATE_NETWORK = '[Local] Network status updated',

    NOTIFY = '[Local] Notifying',
    ACK_NOTIFICATION = '[Local] Acknowledging notification',

    SIGN_IN = '[Backend] Signing in',
    SIGN_OUT = '[Backend] Signing out',
    LOCAL_SIGN_OUT = '[Local] Signing out',

    FETCH_TOKEN = '[Backend] Fetching token',

    FETCH_CURRENT_USER = '[Backend] Fetching current user',

    START_PROFILES_PAGE_LOADER = '[Local] Starting profiles page loader',
    STOP_PROFILES_PAGE_LOADER = '[Local] Stopping profiles page loader',
    SET_GLOBAL_ERROR = '[Local] Setting global error',

    FETCH_USER_EVENT_PROFILE_PAGE = '[Backend] Fetching user\'s event profile page',
    INPUT_PROFILE_PAGE_SEARCH = '[Local] Inputting user\'s event profile page search',
    INPUT_PROFILE_PAGE_DATE_RANGE = '[Local] Inputting user\'s event profile page date range',
    SELECT_PROFILE_PAGE_ORDER = '[Local] Selecting user\'s event profile page order',

    START_INVITATIONS_PAGE_LOADER = '[Local] Starting invitations page loader',
    STOP_INVITATIONS_PAGE_LOADER = '[Local] Stopping invitations page loader',

    FETCH_USER_EVENT_PROFILE_INVITATION_PAGE = '[Backend] Fetching user\'s event profile invitation page',
    INPUT_INVITATION_PAGE_SEARCH = '[Local] Inputting user\'s event profile invitation page search',
    INPUT_INVITATION_PAGE_DATE_RANGE = '[Local] Inputting user\'s event profile invitation page date range',
    SELECT_INVITATION_PAGE_ORDER = '[Local] Selecting user\'s event profile invitation page order',

    START_PROFILE_LOADER = '[Local] Starting profile loader',
    STOP_PROFILE_LOADER = '[Local] Stopping profile loader',

    UPDATE_THEME = '[Local] Updating application theme',

    MANAGE_EVENT_INVITATION_ACCEPTANCE = '[Backend] Managing event\'s invitation acceptance',
    SELECT_USER_EVENT_PROFILE = '[Backend] Selecting user\'s event profile',
    DELETE_USER_EVENT_PROFILE = '[Backend] Deleting user\'s event profile',

    START_CONTEXT_EVENT_LOADER = '[Local] Starting context event loader',
    STOP_CONTEXT_EVENT_LOADER = '[Local] Stopping context loader',

    FETCH_CONTEXT_EVENT = '[Backend] Fetching context event',
}

export class StartGlobalLoader {
    public static readonly type: ActionEnum = ActionEnum.START_GLOBAL_LOADER
}

export class StopGlobalLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_GLOBAL_LOADER
}

export class SetGlobalError {
    public static readonly type: ActionEnum = ActionEnum.SET_GLOBAL_ERROR

    public constructor (public readonly error: HttpErrorResponse) {}
}

export class UpdateNetwork {
    public static readonly type: ActionEnum = ActionEnum.UPDATE_NETWORK

    public constructor (public readonly online: boolean) {}
}

export class Notify {
    public static readonly type: ActionEnum = ActionEnum.NOTIFY

    public constructor (public readonly message: ToastMessageOptions) {}
}

export class AckNotification {
    public static readonly type: ActionEnum = ActionEnum.ACK_NOTIFICATION
}

export class SignIn {
    public static readonly type: ActionEnum = ActionEnum.SIGN_IN
}

export class SignOut {
    public static readonly type: ActionEnum = ActionEnum.SIGN_OUT
}

export class LocalSignOut {
    public static readonly type: ActionEnum = ActionEnum.LOCAL_SIGN_OUT
}

export class FetchToken {
    public static readonly type: ActionEnum = ActionEnum.FETCH_TOKEN
}

export class FetchCurrentUser {
    public static readonly type: ActionEnum = ActionEnum.FETCH_CURRENT_USER

    public constructor (public readonly force: boolean = false) {}
}

export class StartProfilesPageLoader {
    public static readonly type: ActionEnum = ActionEnum.START_PROFILES_PAGE_LOADER
}

export class StopProfilesPageLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_PROFILES_PAGE_LOADER
}

export class FetchUserEventProfilePage {
    public static readonly type: ActionEnum = ActionEnum.FETCH_USER_EVENT_PROFILE_PAGE

    public constructor (
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputProfilePageSearch {
    public static readonly type: ActionEnum = ActionEnum.INPUT_PROFILE_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputProfilePageDateRange {
    public static readonly type: ActionEnum = ActionEnum.INPUT_PROFILE_PAGE_DATE_RANGE

    public constructor (
        public readonly begin: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectProfilePageOrder {
    public static readonly type: ActionEnum = ActionEnum.SELECT_PROFILE_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class StartInvitationsPageLoader {
    public static readonly type: ActionEnum = ActionEnum.START_INVITATIONS_PAGE_LOADER
}

export class StopInvitationsPageLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_INVITATIONS_PAGE_LOADER
}

export class FetchUserEventProfileInvitationPage {
    public static readonly type: ActionEnum = ActionEnum.FETCH_USER_EVENT_PROFILE_INVITATION_PAGE

    public constructor (
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputInvitationPageSearch {
    public static readonly type: ActionEnum = ActionEnum.INPUT_INVITATION_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputInvitationPageDateRange {
    public static readonly type: ActionEnum = ActionEnum.INPUT_INVITATION_PAGE_DATE_RANGE

    public constructor (
        public readonly begin: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectInvitationPageOrder {
    public static readonly type: ActionEnum = ActionEnum.SELECT_INVITATION_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class StartProfileLoader {
    public static readonly type: ActionEnum = ActionEnum.START_PROFILE_LOADER
}

export class StopProfileLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_PROFILE_LOADER
}

export class UpdateTheme {
    public static readonly type: ActionEnum = ActionEnum.UPDATE_THEME

    public constructor (public readonly theme: 'light' | 'dark') {}
}

export class StartContextEventLoader {
    public static readonly type: ActionEnum = ActionEnum.START_CONTEXT_EVENT_LOADER
}

export class StopContextEventLoader {
    public static readonly type: ActionEnum = ActionEnum.STOP_CONTEXT_EVENT_LOADER
}

export class FetchContextEvent {
    public static readonly type: ActionEnum = ActionEnum.FETCH_CONTEXT_EVENT

    public constructor (public readonly eventId: string, public readonly force: boolean) {}
}

export class ManageEventInvitationAcceptance {
    public static readonly type: ActionEnum = ActionEnum.MANAGE_EVENT_INVITATION_ACCEPTANCE

    public constructor (public readonly profileId: string, public readonly status: ProfileStatusEnum) {}
}

export class SelectUserEventProfile {
    public static readonly type: ActionEnum = ActionEnum.SELECT_USER_EVENT_PROFILE

    public constructor (public readonly profile: EventProfileModel) {}
}

export class DeleteUserEventProfile {
    public static readonly type: ActionEnum = ActionEnum.DELETE_USER_EVENT_PROFILE

    public constructor (public readonly profile: EventProfileModel) {}
}
