import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { ProjectPageParamsModel } from '@pages/projects/data/model/project-page-params.model'
import { ProjectStoreModel } from '@pages/projects/data/model/project-store.model'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { elementFetcher, loaderToggle, metadataFetcher, pageFetcher, paramsUpdater } from '@shared/helpers/store/paged-store.methods'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { ProjectModel } from '@shared/models/model/project.model'

interface ProjectsPageRequest {
    pageNumber: number | undefined
    pageSize: number | undefined
}

const defaultProject: ElementRequestInformationModel<ProjectModel> = {
    element: undefined,
    loading: false,
}

const defaultProjectStore: ProjectStoreModel = {
    projects: PageStateHelper.initial<ProjectPageParamsModel, ProjectModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
        withProfile: true,
        dateTimeSearched: undefined,
    } ),
    project: defaultProject,
    createdProjectId: undefined,
    metadata: {
        options: [],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'projects.visible.true', value: true },
            { label: 'projects.visible.false', value: false },
        ],
    },
}

/**
 * Purpose: Holds the project state.
 * Scope: Owns the data of the project pages and resources with their loading and error flags, and fetches them through the project api.
 * Limits: Reached through the project facade; it does not format data or notify the user of command results.
 */
export const ProjectStore = signalStore(
    withState<ProjectStoreModel>( defaultProjectStore ),
    withMethods( (store, api = inject( ProjectApi ), errors = inject( ErrorReporter )) => ({
        fetchProjectOptions: metadataFetcher<ProjectStoreModel, 'options', void, ProjectOptionModel[]>( store, 'options', () => api.getAvailableProjectOptions(), errors ),
        fetchProjectsPage: pageFetcher( store, 'projects', (request: ProjectsPageRequest, params: ProjectPageParamsModel) =>
            api.findProjects( request.pageNumber, request.pageSize, params ), errors ),
        updateProjectsPageSearchParams: paramsUpdater( store, 'projects' ),
        startProjectLoader: loaderToggle( store, 'project', true ),
        stopProjectLoader: loaderToggle( store, 'project', false ),
        fetchProject: elementFetcher( store, 'project', (id: string) => api.findProjectById( id ), errors ),
        resetProject: (): void => patchState( store, { project: defaultProject } ),
        setCreatedProjectId: (id: string | undefined): void => patchState( store, { createdProjectId: id } ),
    }) ),
)
