import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { ProjectPageParamsModel } from '@pages/projects/data/model/project-page-params.model'
import { ProjectStoreModel } from '@pages/projects/data/model/project-store.model'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'

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
    withMethods( (
        store,
        api = inject( ProjectApi ),
        errors = inject( ErrorReporter ),
    ) => ({
        fetchProjectOptions: rxMethod<void>( pipe(
            switchMap( (): Observable<ProjectOptionModel[]> => api.getAvailableProjectOptions().pipe(
                notifyOnError( errors ),
            ) ),
            tap( (options: ProjectOptionModel[]): void => patchState( store, (state: ProjectStoreModel) => ({
                metadata: { ...state.metadata, options: options },
            }) ) ),
        ) ),

        fetchProjectsPage: rxMethod<ProjectsPageRequest>( pipe(
            switchMap( (request: ProjectsPageRequest): Observable<PageModel<ProjectModel>> => api.findProjects(
                request.pageNumber,
                request.pageSize,
                store.projects.params(),
            ).pipe(
                trackPage( errors, pageSlice( store, 'projects' ) ),
            ) ),
            tap( (page: PageModel<ProjectModel>): void => patchState( store, (state: ProjectStoreModel) => ({
                projects: {
                    ...state.projects,
                    params: { ...state.projects.params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) ),

        updateProjectsPageSearchParams: (params: ProjectPageParamsModel): void => {
            patchState( store, (state: ProjectStoreModel) => ({ projects: { ...state.projects, params: params } }) )
        },

        startProjectLoader: (): void => {
            patchState( store, (state: ProjectStoreModel) => ({ project: StateHelper.updateElementLoader( state.project, true ) }) )
        },

        stopProjectLoader: (): void => {
            patchState( store, (state: ProjectStoreModel) => ({ project: StateHelper.updateElementLoader( state.project, false ) }) )
        },

        fetchProject: rxMethod<string>( pipe(
            switchMap( (id: string): Observable<ProjectModel> => api.findProjectById( id ).pipe(
                initialize( (): void => patchState( store, (state: ProjectStoreModel) => ({
                    project: StateHelper.updateElementLoader( state.project, true ),
                }) ) ),
                finalize( (): void => patchState( store, (state: ProjectStoreModel) => ({
                    project: StateHelper.updateElementLoader( state.project, false ),
                }) ) ),
                notifyOnError( errors ),
            ) ),
            tap( (project: ProjectModel): void => patchState( store, (state: ProjectStoreModel) => ({
                project: { ...state.project, element: project },
            }) ) ),
        ) ),

        resetProject: (): void => {
            patchState( store, { project: defaultProject } )
        },

        setCreatedProjectId: (id: string | undefined): void => {
            patchState( store, { createdProjectId: id } )
        },
    }) ),
)
