import { ProjectProfileModel } from '../../../../../../shared/util-model/model/project-profile.model'
import { ProjectProfileDto } from '../dto/project-profile.dto'
import { ProjectProfilesDto } from '../dto/project-profiles.dto'
import { ProjectProfilePageParamsModel } from '../model/project-profile-page-params.model'

enum ProjectProfileActionEnum {
    START_PROJECT_PROFILES_PAGE_LOADER = '[Local] Starting project profiles\' page loader',
    STOP_PROJECT_PROFILES_PAGE_LOADER = '[Local] Stopping project profiles\' page loader',

    FETCH_PROJECT_PROFILES_PAGE = '[Backend] Fetching project profiles\' page',
    UPDATE_PROJECT_PROFILES_PAGE_SEARCH_PARAMS = '[Local] Updating project profiles\' page search params',

    START_PROJECT_PROFILE_LOADER = '[Local] Starting project profile\'s loader',
    STOP_PROJECT_PROFILE_LOADER = '[Local] Stopping project profile\'s loader',

    FETCH_PROJECT_PROFILE = '[Backend] Fetching project profile',
    RESET_PROJECT_PROFILE = '[Local] Resetting project profile',
    SEARCH_USERS = '[Backend] Searching users to invite',
    FETCH_ASSIGNABLE_PROJECT_PROFILE_ROLES = '[Backend] Fetching assignable project profile\'s roles',
    FETCH_AVAILABLE_PROJECT_PROFILE_STATUS = '[Backend] Fetching available project profile\'s status',
    CREATE_PROJECT_PROFILES = '[Backend] Creating project profile',
    UPDATE_PROJECT_PROFILE = '[Backend] Updating project profile',
    BLOCK_PROJECT_PROFILE = '[Backend] Blocking project profile',
    UNBLOCK_PROJECT_PROFILE = '[Backend] Unblocking project profile',
    DELETE_PROJECT_PROFILE = '[Backend] Deleting project profile',
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

export class StartProjectProfileLoader {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.START_PROJECT_PROFILE_LOADER
}

export class StopProjectProfileLoader {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.STOP_PROJECT_PROFILE_LOADER
}

export class FetchProjectProfile {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.FETCH_PROJECT_PROFILE

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class ResetProjectProfile {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.RESET_PROJECT_PROFILE
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

export class CreateProjectProfiles {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.CREATE_PROJECT_PROFILES

    public constructor (public readonly projectId: string | undefined, public readonly profiles: ProjectProfilesDto) {}
}

export class UpdateProjectProfile {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.UPDATE_PROJECT_PROFILE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly profile: ProjectProfileDto,
    ) {}
}

export class BlockProjectProfile {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.BLOCK_PROJECT_PROFILE

    public constructor (public readonly projectId: string | undefined, public readonly profile: ProjectProfileModel) {}
}

export class UnblockProjectProfile {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.UNBLOCK_PROJECT_PROFILE

    public constructor (public readonly projectId: string | undefined, public readonly profile: ProjectProfileModel) {}
}

export class DeleteProjectProfile {
    public static readonly type: ProjectProfileActionEnum = ProjectProfileActionEnum.DELETE_PROJECT_PROFILE

    public constructor (public readonly projectId: string | undefined, public readonly profile: ProjectProfileModel) {}
}
