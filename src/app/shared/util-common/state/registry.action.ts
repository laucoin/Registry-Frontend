import { ToastMessageOptions } from 'primeng/api'
import { ProjectProfileModel } from '../../util-model/model/project-profile.model'
import { TokenModel } from '../../util-authentication/model/token.model'
import { ErrorModel } from '../../util-model/model/error.model'
import { ProjectModel } from '../../util-model/model/project.model'

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

    START_USER_PROJECT_PROFILES_PAGE_LOADER = '[Local] Starting user project profiles\' page loader',
    STOP_USER_PROJECT_PROFILES_PAGE_LOADER = '[Local] Stopping user project profiles\' page loader',

    FETCH_USER_PROJECT_PROFILES_PAGE = '[Backend] Fetching user project profiles\' page',
    UPDATE_USER_PROJECT_PROFILES_PAGE_SEARCH_PARAMS = '[Local] Updating user project profiles\' page search params',

    START_USER_PROJECT_PROFILE_INVITATIONS_PAGE_LOADER = '[Local] Starting user project profile invitations\' page loader',
    STOP_USER_PROJECT_PROFILE_INVITATIONS_PAGE_LOADER = '[Local] Stopping user project profile invitations\' page loader',

    FETCH_USER_PROJECT_PROFILE_INVITATIONS_PAGE = '[Backend] Fetching user project profile invitations\' page',
    UPDATE_USER_PROJECT_PROFILE_INVITATIONS_PAGE_SEARCH_PARAMS = '[Local] Updating user project profile invitations\' page search params',

    START_USER_PROJECT_PROFILE_LOADER = '[Local] Starting user project profile loader',
    STOP_USER_PROJECT_PROFILE_LOADER = '[Local] Stopping user project profile loader',

    MANAGE_USER_PROJECT_INVITATION_ACCEPTANCE = '[Backend] Managing user project invitation acceptance',
    SELECT_USER_PROJECT_PROFILE = '[Backend] Selecting user project profile',
    SELECT_USER_PROJECT_PROFILE_BY_PROJECT = '[Backend] Selecting user project profile by project',
    DELETE_USER_PROJECT_PROFILE = '[Backend] Deleting user project profile',

    CREATE_SUPPORT_PROJECT_PROFILE = '[Backend] Creating project profiles',
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

export class StartUserProjectProfilesPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_USER_PROJECT_PROFILES_PAGE_LOADER
}

export class StopUserProjectProfilesPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_USER_PROJECT_PROFILES_PAGE_LOADER
}

export class FetchUserProjectProfilesPage {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.FETCH_USER_PROJECT_PROFILES_PAGE

    public constructor (
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateUserProjectProfilesPageSearchParams {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_USER_PROJECT_PROFILES_PAGE_SEARCH_PARAMS

    public constructor (
        public readonly resetSearch: boolean,
        public readonly textSearched: string | undefined,
        public readonly dateTimeSearched: string | undefined,
    ) {}
}

export class StartUserProjectProfileInvitationsPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_USER_PROJECT_PROFILE_INVITATIONS_PAGE_LOADER
}

export class StopUserProjectProfileInvitationsPageLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_USER_PROJECT_PROFILE_INVITATIONS_PAGE_LOADER
}

export class FetchUserProjectProfileInvitationsPage {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.FETCH_USER_PROJECT_PROFILE_INVITATIONS_PAGE

    public constructor (
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateUserProjectProfileInvitationsPageSearchParams {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_USER_PROJECT_PROFILE_INVITATIONS_PAGE_SEARCH_PARAMS

    public constructor (
        public readonly resetSearch: boolean,
        public readonly textSearched: string | undefined,
        public readonly dateTimeSearched: string | undefined,
    ) {}
}

export class StartUserProjectProfileLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_USER_PROJECT_PROFILE_LOADER
}

export class StopUserProjectProfileLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_USER_PROJECT_PROFILE_LOADER
}

export class ManageUserProjectInvitationAcceptance {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.MANAGE_USER_PROJECT_INVITATION_ACCEPTANCE

    public constructor (public readonly profileId: string, public readonly accepted: boolean) {}
}

export class SelectUserProjectProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.SELECT_USER_PROJECT_PROFILE

    public constructor (public readonly profile: ProjectProfileModel) {}
}

export class SelectUserProjectProfileByProject {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.SELECT_USER_PROJECT_PROFILE_BY_PROJECT

    public constructor (public readonly project: ProjectModel) {}
}

export class DeleteUserProjectProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.DELETE_USER_PROJECT_PROFILE

    public constructor (public readonly profile: ProjectProfileModel) {}
}

export class CreateSupportProjectProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.CREATE_SUPPORT_PROJECT_PROFILE

    public constructor (public readonly projectId: string) {}
}
