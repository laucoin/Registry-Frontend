import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, EMPTY, finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { ProjectPageParamsModel } from '@pages/projects/data/model/project-page-params.model'
import { ProjectStoreModel } from '@pages/projects/data/model/project-store.model'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, notifyOnError, reportError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'

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

export const ProjectStore = signalStore(
    withState<ProjectStoreModel>( defaultProjectStore ),
    withProps( () => ({
        api: inject( ProjectApi ),
        registryFacade: inject( RegistryFacade ),
    }) ),
    withMethods( (store) => ({
        fetchProjectOptions: rxMethod<void>( pipe(
            switchMap( (): Observable<ProjectOptionModel[]> => store.api.getAvailableProjectOptions().pipe(
                notifyOnError( store.registryFacade ),
            ) ),
            tap( (options: ProjectOptionModel[]): void => patchState( store, (state: ProjectStoreModel) => ({
                metadata: { ...state.metadata, options: options },
            }) ) ),
        ) ),

        fetchProjectsPage: rxMethod<ProjectsPageRequest>( pipe(
            switchMap( (request: ProjectsPageRequest): Observable<PageModel<ProjectModel>> => store.api.findProjects(
                request.pageNumber,
                request.pageSize,
                store.projects.params(),
            ).pipe(
                initialize( (): void => patchState( store, (state: ProjectStoreModel) => ({
                    projects: StateHelper.updatePageLoader( state.projects, true ),
                }) ) ),
                finalize( (): void => patchState( store, (state: ProjectStoreModel) => ({
                    projects: StateHelper.updatePageLoader( state.projects, false ),
                }) ) ),
                catchError( (error: ErrorModel): Observable<never> => {
                    if (error.status === 503) {
                        reportError( store.registryFacade, error )
                    } else {
                        patchState( store, (state: ProjectStoreModel) => ({
                            projects: PageStateHelper.withError( state.projects, error ),
                        }) )
                    }
                    return EMPTY
                } ),
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
            switchMap( (id: string): Observable<ProjectModel> => store.api.findProjectById( id ).pipe(
                initialize( (): void => patchState( store, (state: ProjectStoreModel) => ({
                    project: StateHelper.updateElementLoader( state.project, true ),
                }) ) ),
                finalize( (): void => patchState( store, (state: ProjectStoreModel) => ({
                    project: StateHelper.updateElementLoader( state.project, false ),
                }) ) ),
                notifyOnError( store.registryFacade ),
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
