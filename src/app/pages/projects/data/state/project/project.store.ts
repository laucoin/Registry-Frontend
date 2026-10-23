import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericElementStore } from '@shared/helpers/state/generic-element.store'
import { initialize } from '@shared/helpers/rx.helper'
import {
    CreateProject,
    DeleteProject,
    DisableProject,
    EnableProject,
    FetchProject,
    FetchProjectOptions,
    FetchProjectsPage,
    ResetProject,
    StartProjectLoader,
    StartProjectsPageLoader,
    StopProjectLoader,
    StopProjectsPageLoader,
    UpdateProject,
    UpdateProjectsPageSearchParams,
} from '@pages/projects/data/state/project/project.action'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { inject, Injectable } from '@angular/core'
import { StateHelper } from '@shared/helpers/state/state.helper'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectStoreModel } from '@pages/projects/data/model/project-store.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

const defaultProject: ElementRequestInformationModel<ProjectModel> = {
    element: undefined,
    loading: false,
}

const defaultProjectStore: ProjectStoreModel = {
    projects: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            visibilitySearched: undefined,
            withProfile: true,
            dateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    project: defaultProject,
    createdProjectId: undefined,
    _metadata: {
        options: [],
        visibilities: [
            {
                label: '-',
                value: undefined,
            },
            {
                label: 'projects.visible.true',
                value: true,
            },
            {
                label: 'projects.visible.false',
                value: false,
            },
        ],
    },
}

@State<ProjectStoreModel>( {
    name: 'project',
    defaults: defaultProjectStore,
} )
@Injectable()
export class ProjectStore extends GenericElementStore<ProjectStoreModel> {
    private readonly api: ProjectApi = inject( ProjectApi )
    private readonly facade: ProjectFacade = inject( ProjectFacade )

    private readonly projectIcon: string = 'pi pi-calendar'

    @Selector()
    public static projectsPage (state: ProjectStoreModel): PageModel<ProjectModel> | undefined {
        return state.projects.element
    }

    @Selector()
    public static projectsPageLoading (state: ProjectStoreModel): boolean {
        return state.projects.loading
    }

    @Selector()
    public static projectsPageError (state: ProjectStoreModel): ToastMessageOptions | undefined {
        return state.projects.error
    }

    @Selector()
    public static projectsPageSilentLoading (state: ProjectStoreModel): boolean {
        return state.projects.silentLoading
    }

    @Selector()
    public static projectsPageResetSearch (state: ProjectStoreModel): boolean {
        return state.projects.params.resetSearch
    }

    @Selector()
    public static projectsPageTextSearchedParam (state: ProjectStoreModel): string | undefined {
        return state.projects.params.textSearched
    }

    @Selector()
    public static projectsPageWithProfileSearchedParam (state: ProjectStoreModel): boolean | undefined {
        return state.projects.params.withProfile
    }

    @Selector()
    public static projectsPageDateTimeSearchedParam (state: ProjectStoreModel): string | undefined {
        return state.projects.params.dateTimeSearched
    }

    @Selector()
    public static projectsPageVisibilitySearchedParam (state: ProjectStoreModel): boolean | undefined {
        return state.projects.params.visibilitySearched
    }

    @Selector()
    public static createdProjectId (state: ProjectStoreModel): string | undefined {
        return state.createdProjectId
    }

    @Selector()
    public static project (state: ProjectStoreModel): ProjectModel | undefined {
        return state.project.element
    }

    @Selector()
    public static projectLoading (state: ProjectStoreModel): boolean {
        return state.project.loading
    }

    @Selector()
    public static projectOptionsMetadata (state: ProjectStoreModel): ProjectOptionModel[] {
        return state._metadata.options
    }

    @Selector()
    public static visibilitiesMetadata (state: ProjectStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( FetchProjectOptions )
    public fetchProjectOptions (ctx: StateContext<ProjectStoreModel>): Observable<void> {
        return this.api.getAvailableProjectOptions().pipe(
            map( (options: ProjectOptionModel[]): void => this.fetchProjectOptionsComplete( ctx, options ) ),
        )
    }

    private fetchProjectOptionsComplete (
        ctx: StateContext<ProjectStoreModel>,
        options: ProjectOptionModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                options: options,
            },
        } )
    }

    @Action( StartProjectsPageLoader )
    public startProjectsPageLoader (ctx: StateContext<ProjectStoreModel>): void {
        ctx.patchState( {
            projects: StateHelper.updatePageLoader( ctx.getState().projects, true ),
        } )
    }

    @Action( StopProjectsPageLoader )
    public stopProjectsPageLoader (ctx: StateContext<ProjectStoreModel>): void {
        ctx.patchState( {
            projects: StateHelper.updatePageLoader( ctx.getState().projects, false ),
        } )
    }

    @Action( FetchProjectsPage )
    public fetchProjectsPage (ctx: StateContext<ProjectStoreModel>, payload: FetchProjectsPage): Observable<void> {
        return this.api.findProjects( payload.pageNumber, payload.pageSize, ctx.getState().projects.params ).pipe(
            initialize( (): void => this.facade.startProjectsPageLoader() ),
            finalize( (): void => this.facade.stopProjectsPageLoader() ),
            map( (projectPage: PageModel<ProjectModel>): void => this.fetchProjectsPageComplete( ctx, projectPage ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchProjectsPageComplete (
        ctx: StateContext<ProjectStoreModel>,
        projectPage: PageModel<ProjectModel>,
    ): void {
        ctx.patchState( {
            projects: {
                ...ctx.getState().projects,
                params: {
                    ...ctx.getState().projects.params,
                    resetSearch: false,
                },
                element: projectPage,
            },
        } )
    }

    @Action( UpdateProjectsPageSearchParams )
    public updateProjectsPageSearchParams (
        ctx: StateContext<ProjectStoreModel>,
        payload: UpdateProjectsPageSearchParams,
    ): void {
        ctx.patchState( {
            projects: {
                ...ctx.getState().projects,
                params: payload.params,
            },
        } )
    }

    @Action( StartProjectLoader )
    public startProjectLoader (ctx: StateContext<ProjectStoreModel>): void {
        ctx.patchState( {
            project: StateHelper.updateElementLoader( ctx.getState().project, true ),
        } )
    }

    @Action( StopProjectLoader )
    public stopProjectLoader (ctx: StateContext<ProjectStoreModel>): void {
        ctx.patchState( {
            project: StateHelper.updateElementLoader( ctx.getState().project, false ),
        } )
    }

    @Action( FetchProject )
    public fetchProject (ctx: StateContext<ProjectStoreModel>, payload: FetchProject): Observable<void> {
        return this.api.findProjectById( payload.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.fetchProjectComplete( ctx, project ) ),
        )
    }

    private fetchProjectComplete (ctx: StateContext<ProjectStoreModel>, project: ProjectModel): void {
        ctx.patchState( {
            project: {
                ...ctx.getState().project,
                element: project,
            },
        } )
    }

    @Action( ResetProject )
    public resetProject (ctx: StateContext<ProjectStoreModel>): void {
        ctx.patchState( {
            project: defaultProject,
        } )
    }

    @Action( CreateProject )
    public createProject (ctx: StateContext<ProjectStoreModel>, payload: CreateProject): Observable<void> {
        return this.api.createProject( payload.project ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.createProjectComplete( ctx, project ) ),
        )
    }

    private createProjectComplete (ctx: StateContext<ProjectStoreModel>, project: ProjectModel): void {
        ctx.patchState( { createdProjectId: project.id } )
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.create.title',
            'projects.notifications.create.message',
            this.projectIcon,
            this.buildTranslationArgs( project ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( UpdateProject )
    public updateProject (ctx: StateContext<ProjectStoreModel>, payload: UpdateProject): Observable<void> {
        return this.api.updateProjectById( payload.id, payload.project ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.updateProjectComplete( ctx, project ) ),
        )
    }

    private updateProjectComplete (ctx: StateContext<ProjectStoreModel>, project: ProjectModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.edit.title',
            'projects.notifications.edit.message',
            this.projectIcon,
            this.buildTranslationArgs( project ),
        )

        if (this.registryFacade.currentProjectId() == project.id) {
            this.registryFacade.fetchCurrentUser()
        }

        this.refreshPage( ctx )
    }

    @Action( DisableProject )
    public disableProject (ctx: StateContext<ProjectStoreModel>, payload: DisableProject): Observable<void> {
        return this.api.disableProjectById( payload.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.disableProjectComplete( ctx, project ) ),
        )
    }

    private disableProjectComplete (ctx: StateContext<ProjectStoreModel>, project: ProjectModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.disable.title',
            'projects.notifications.disable.message',
            this.projectIcon,
            this.buildTranslationArgs( project ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( EnableProject )
    public enableProject (ctx: StateContext<ProjectStoreModel>, payload: EnableProject): Observable<void> {
        return this.api.enableProjectById( payload.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.enableProjectComplete( ctx, project ) ),
        )
    }

    private enableProjectComplete (ctx: StateContext<ProjectStoreModel>, project: ProjectModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.enable.title',
            'projects.notifications.enable.message',
            this.projectIcon,
            this.buildTranslationArgs( project ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    @Action( DeleteProject )
    public deleteProject (ctx: StateContext<ProjectStoreModel>, payload: DeleteProject): Observable<void> {
        return this.api.deleteProjectById( payload.project.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (): void => this.deleteProjectComplete( ctx, payload.project ) ),
        )
    }

    private deleteProjectComplete (ctx: StateContext<ProjectStoreModel>, project: ProjectModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.delete.title',
            'projects.notifications.delete.message',
            this.projectIcon,
            this.buildTranslationArgs( project ),
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (project: ProjectModel): object {
        return { name: project.name }
    }

    protected refreshPage (ctx: StateContext<ProjectStoreModel>): void {
        const page: PageModel<ProjectModel> | undefined = ctx.getState().projects.element
        this.facade.fetchProjectsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<ProjectStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                projects: this.buildErrorMessage( ctx.getState().projects, error ),
            } )
        }

        return of()
    }
}
