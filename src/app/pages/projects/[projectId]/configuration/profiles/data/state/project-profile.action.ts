import { ProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'

enum ProjectProfileActionEnum {
    RESET_PROJECT_PROFILE_STATE = '[Local] Resetting project profile state',

    START_PROJECT_PROFILES_PAGE_LOADER = '[Local] Starting project profiles\' page loader',
    STOP_PROJECT_PROFILES_PAGE_LOADER = '[Local] Stopping project profiles\' page loader',

    FETCH_PROJECT_PROFILES_PAGE = '[Backend] Fetching project profiles\' page',
    UPDATE_PROJECT_PROFILES_PAGE_SEARCH_PARAMS = '[Local] Updating project profiles\' page search params',


    SEARCH_USERS = '[Backend] Searching users to invite',
    FETCH_ASSIGNABLE_PROJECT_PROFILE_ROLES = '[Backend] Fetching assignable project profile\'s roles',
    FETCH_AVAILABLE_PROJECT_PROFILE_STATUS = '[Backend] Fetching available project profile\'s status',
}

export class ResetProjectProfileState {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.RESET_PROJECT_PROFILE_STATE
}

export class StartProjectProfilesPageLoader {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.START_PROJECT_PROFILES_PAGE_LOADER
}

export class StopProjectProfilesPageLoader {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.STOP_PROJECT_PROFILES_PAGE_LOADER
}

export class FetchProjectProfilesPage {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.FETCH_PROJECT_PROFILES_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateProjectProfilesPageSearchParams {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.UPDATE_PROJECT_PROFILES_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: ProjectProfilePageParamsModel) {}
}

export class SearchUsers {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.SEARCH_USERS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}

export class FetchAssignableProjectProfileRoles {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.FETCH_ASSIGNABLE_PROJECT_PROFILE_ROLES

    public constructor (public readonly projectId: string | undefined) {}
}

export class FetchProfileStatus {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.FETCH_AVAILABLE_PROJECT_PROFILE_STATUS
}
