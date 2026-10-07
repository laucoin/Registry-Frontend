import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

enum RegistryActionEnum {




    START_CURRENT_USER_ACTION_LOADER = '[Local] Starting current user action loader',
    STOP_CURRENT_USER_ACTION_LOADER = '[Local] Stopping current user action loader',

    LOGIN = '[Backend] Logging in',
    LOGOUT = '[Backend] Logging out',

    FETCH_TOKENS = '[Backend] Fetching tokens',

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

    UPDATE_CURRENT_USER_THEME = '[Backend] Updating current user theme',
    UPDATE_CURRENT_USER_LANGUAGE = '[Backend] Updating current user language',

    MANAGE_USER_PROJECT_INVITATION_ACCEPTANCE = '[Backend] Managing user project invitation acceptance',
    SET_CURRENT_PROJECT = '[Backend] Setting current project from route',
    DELETE_USER_PROJECT_PROFILE = '[Backend] Deleting user project profile',

    CREATE_SUPPORT_PROJECT_PROFILE = '[Backend] Creating project profiles',
}

export class StartCurrentUserActionLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.START_CURRENT_USER_ACTION_LOADER
}

export class StopCurrentUserActionLoader {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.STOP_CURRENT_USER_ACTION_LOADER
}

export class Login {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.LOGIN
}

export class Logout {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.LOGOUT
}

export class FetchTokens {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.FETCH_TOKENS

    public constructor (public readonly authorizationCode: string) {}
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
        public readonly availabilitySearched: boolean | undefined,
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

export class UpdateCurrentUserTheme {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_CURRENT_USER_THEME

    public constructor (public readonly theme: ThemeEnum) {}
}

export class UpdateCurrentUserLanguage {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.UPDATE_CURRENT_USER_LANGUAGE

    public constructor (public readonly language: string) {}
}

export class ManageUserProjectInvitationAcceptance {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.MANAGE_USER_PROJECT_INVITATION_ACCEPTANCE

    public constructor (public readonly profileId: string, public readonly accepted: boolean) {}
}

export class SetCurrentProject {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.SET_CURRENT_PROJECT

    public constructor (public readonly projectId: string | undefined) {}
}

export class DeleteUserProjectProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.DELETE_USER_PROJECT_PROFILE

    public constructor (public readonly profile: ProjectProfileModel) {}
}

export class CreateSupportProjectProfile {
    public static readonly type: RegistryActionEnum = RegistryActionEnum.CREATE_SUPPORT_PROJECT_PROFILE

    public constructor (public readonly projectId: string) {}
}
