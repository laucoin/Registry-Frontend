import { ProjectModel } from '../../../../../shared/util-model/model/project.model'
import { ProjectDto } from '../../dto/project.dto'
import { ProjectPageParamsModel } from '../../model/project-page-params.model'

enum AllProjectsActionEnum {
    FETCH_PROJECT_OPTIONS = '[Backend] Fetching project\'s options',

    START_PROJECTS_PAGE_LOADER = '[Local] Starting projects\' page loader',
    STOP_PROJECTS_PAGE_LOADER = '[Local] Stopping projects\' page loader',

    FETCH_PROJECTS_PAGE = '[Backend] Fetching projects\' page',
    UPDATE_PROJECTS_PAGE_SEARCH_PARAMS = '[Local] Updating projects\' page search params',

    START_PROJECT_LOADER = '[Local] Starting project loader',
    STOP_PROJECT_LOADER = '[Local] Stopping project loader',

    FETCH_PROJECT = '[Backend] Fetching project',
    RESET_PROJECT = '[Local] Resetting project',
    CREATE_PROJECT = '[Backend] Creating project',
    UPDATE_PROJECT = '[Backend] Updating project',
    DISABLE_PROJECT = '[Backend] Disabling project',
    ENABLE_PROJECT = '[Backend] Enabling project',
    DELETE_PROJECT = '[Backend] Deleting project',
}

export class FetchProjectOptions {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.FETCH_PROJECT_OPTIONS
}

export class StartProjectsPageLoader {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.START_PROJECTS_PAGE_LOADER
}

export class StopProjectsPageLoader {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.STOP_PROJECTS_PAGE_LOADER
}

export class FetchProjectsPage {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.FETCH_PROJECTS_PAGE

    public constructor (
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateProjectsPageSearchParams {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.UPDATE_PROJECTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: ProjectPageParamsModel) {}
}

export class StartProjectLoader {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.START_PROJECT_LOADER
}

export class StopProjectLoader {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.STOP_PROJECT_LOADER
}

export class FetchProject {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.FETCH_PROJECT

    public constructor (public readonly id: string) {}
}

export class ResetProject {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.RESET_PROJECT
}

export class CreateProject {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.CREATE_PROJECT

    public constructor (public readonly project: ProjectDto) {}
}

export class UpdateProject {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.UPDATE_PROJECT

    public constructor (public readonly id: string, public readonly project: ProjectDto) {}
}

export class DisableProject {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.DISABLE_PROJECT

    public constructor (public readonly id: string) {}
}

export class EnableProject {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.ENABLE_PROJECT

    public constructor (public readonly id: string) {}
}

export class DeleteProject {
    public static readonly type: AllProjectsActionEnum = AllProjectsActionEnum.DELETE_PROJECT

    public constructor (public readonly project: ProjectModel) {}
}
