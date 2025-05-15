import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { GenericElementState } from '../../../../../shared/util-tool/state/generic-element.state'
import { initialize } from '../../../../../shared/util-tool/util/rx.util'
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
} from './project.action'
import { ProjectService } from '../project.service'
import { ProjectFacade } from './project.facade'
import { inject, Injectable } from '@angular/core'
import { StateUtil } from '../../../../../shared/util-tool/state/state.util'
import {
    ElementRequestInformationModel,
} from '../../../../../shared/util-model/model/element-request-information.model'
import { ProjectOptionModel } from '../../model/project-option.model'
import { ErrorModel } from '../../../../../shared/util-model/model/error.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ProjectModel } from '../../../../../shared/util-model/model/project.model'
import { ProjectStateModel } from '../../model/project-state.model'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'

const defaultProject: ElementRequestInformationModel<ProjectModel> = {
    element: undefined,
    loading: false,
}

const defaultProjectState: ProjectStateModel = {
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

@State<ProjectStateModel>( {
    name: 'project',
    defaults: defaultProjectState,
} )
@Injectable()
export class ProjectState extends GenericElementState<ProjectStateModel> {
    private readonly service: ProjectService = inject( ProjectService )
    private readonly facade: ProjectFacade = inject( ProjectFacade )

    private readonly projectIcon: string = 'pi pi-calendar'

    @Selector()
    public static projectsPage (state: ProjectStateModel): PageModel<ProjectModel> | undefined {
        return state.projects.element
    }

    @Selector()
    public static projectsPageLoading (state: ProjectStateModel): boolean {
        return state.projects.loading
    }

    @Selector()
    public static projectsPageError (state: ProjectStateModel): ToastMessageOptions | undefined {
        return state.projects.error
    }

    @Selector()
    public static projectsPageSilentLoading (state: ProjectStateModel): boolean {
        return state.projects.silentLoading
    }

    @Selector()
    public static projectsPageResetSearch (state: ProjectStateModel): boolean {
        return state.projects.params.resetSearch
    }

    @Selector()
    public static projectsPageTextSearchedParam (state: ProjectStateModel): string | undefined {
        return state.projects.params.textSearched
    }

    @Selector()
    public static projectsPageWithProfileSearchedParam (state: ProjectStateModel): boolean | undefined {
        return state.projects.params.withProfile
    }

    @Selector()
    public static projectsPageDateTimeSearchedParam (state: ProjectStateModel): string | undefined {
        return state.projects.params.dateTimeSearched
    }

    @Selector()
    public static projectsPageVisibilitySearchedParam (state: ProjectStateModel): boolean | undefined {
        return state.projects.params.visibilitySearched
    }

    @Selector()
    public static project (state: ProjectStateModel): ProjectModel | undefined {
        return state.project.element
    }

    @Selector()
    public static projectLoading (state: ProjectStateModel): boolean {
        return state.project.loading
    }

    @Selector()
    public static projectOptionsMetadata (state: ProjectStateModel): ProjectOptionModel[] {
        return state._metadata.options
    }

    @Selector()
    public static visibilitiesMetadata (state: ProjectStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( FetchProjectOptions )
    public fetchProjectOptions (ctx: StateContext<ProjectStateModel>): Observable<void> {
        return this.service.getAvailableProjectOptions().pipe(
            map( (options: ProjectOptionModel[]): void => this.fetchProjectOptionsComplete( ctx, options ) ),
        )
    }

    private fetchProjectOptionsComplete (
        ctx: StateContext<ProjectStateModel>,
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
    public startProjectsPageLoader (ctx: StateContext<ProjectStateModel>): void {
        ctx.patchState( {
            projects: StateUtil.updatePageLoader( ctx.getState().projects, true ),
        } )
    }

    @Action( StopProjectsPageLoader )
    public stopProjectsPageLoader (ctx: StateContext<ProjectStateModel>): void {
        ctx.patchState( {
            projects: StateUtil.updatePageLoader( ctx.getState().projects, false ),
        } )
    }

    @Action( FetchProjectsPage )
    public fetchProjectsPage (ctx: StateContext<ProjectStateModel>, payload: FetchProjectsPage): Observable<void> {
        return this.service.findProjects( payload.pageNumber, payload.pageSize, ctx.getState().projects.params ).pipe(
            initialize( (): void => this.facade.startProjectsPageLoader() ),
            finalize( (): void => this.facade.stopProjectsPageLoader() ),
            map( (projectPage: PageModel<ProjectModel>): void => this.fetchProjectsPageComplete( ctx, projectPage ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchProjectsPageComplete (
        ctx: StateContext<ProjectStateModel>,
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
        ctx: StateContext<ProjectStateModel>,
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
    public startProjectLoader (ctx: StateContext<ProjectStateModel>): void {
        ctx.patchState( {
            project: StateUtil.updateElementLoader( ctx.getState().project, true ),
        } )
    }

    @Action( StopProjectLoader )
    public stopProjectLoader (ctx: StateContext<ProjectStateModel>): void {
        ctx.patchState( {
            project: StateUtil.updateElementLoader( ctx.getState().project, false ),
        } )
    }

    @Action( FetchProject )
    public fetchProject (ctx: StateContext<ProjectStateModel>, payload: FetchProject): Observable<void> {
        return this.service.findProjectById( payload.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.fetchProjectComplete( ctx, project ) ),
        )
    }

    private fetchProjectComplete (ctx: StateContext<ProjectStateModel>, project: ProjectModel): void {
        ctx.patchState( {
            project: {
                ...ctx.getState().project,
                element: project,
            },
        } )
    }

    @Action( ResetProject )
    public resetProject (ctx: StateContext<ProjectStateModel>): void {
        ctx.patchState( {
            project: defaultProject,
        } )
    }

    @Action( CreateProject )
    public createProject (ctx: StateContext<ProjectStateModel>, payload: CreateProject): Observable<void> {
        return this.service.createProject( payload.project ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.createProjectComplete( ctx, project ) ),
        )
    }

    private createProjectComplete (ctx: StateContext<ProjectStateModel>, project: ProjectModel): void {
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
    public updateProject (ctx: StateContext<ProjectStateModel>, payload: UpdateProject): Observable<void> {
        return this.service.updateProjectById( payload.id, payload.project ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.updateProjectComplete( ctx, project ) ),
        )
    }

    private updateProjectComplete (ctx: StateContext<ProjectStateModel>, project: ProjectModel): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.edit.title',
            'projects.notifications.edit.message',
            this.projectIcon,
            this.buildTranslationArgs( project ),
        )

        if (this.registryFacade.currentUser()?.preferences.selectedProfile?.project?.id == project.id) {
            this.registryFacade.fetchCurrentUser()
        }

        this.refreshPage( ctx )
    }

    @Action( DisableProject )
    public disableProject (ctx: StateContext<ProjectStateModel>, payload: DisableProject): Observable<void> {
        return this.service.disableProjectById( payload.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.disableProjectComplete( ctx, project ) ),
        )
    }

    private disableProjectComplete (ctx: StateContext<ProjectStateModel>, project: ProjectModel): void {
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
    public enableProject (ctx: StateContext<ProjectStateModel>, payload: EnableProject): Observable<void> {
        return this.service.enableProjectById( payload.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (project: ProjectModel): void => this.enableProjectComplete( ctx, project ) ),
        )
    }

    private enableProjectComplete (ctx: StateContext<ProjectStateModel>, project: ProjectModel): void {
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
    public deleteProject (ctx: StateContext<ProjectStateModel>, payload: DeleteProject): Observable<void> {
        return this.service.deleteProjectById( payload.project.id ).pipe(
            initialize( (): void => this.facade.startProjectLoader() ),
            finalize( (): void => this.facade.stopProjectLoader() ),
            map( (): void => this.deleteProjectComplete( ctx, payload.project ) ),
        )
    }

    private deleteProjectComplete (ctx: StateContext<ProjectStateModel>, project: ProjectModel): void {
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

    protected refreshPage (ctx: StateContext<ProjectStateModel>): void {
        const page: PageModel<ProjectModel> | undefined = ctx.getState().projects.element
        this.facade.fetchProjectsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<ProjectStateModel>, error: ErrorModel): Observable<void> {
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
