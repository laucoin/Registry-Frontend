import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericFacade } from '../../../../../shared/util-tool/facade/generic.facade'
import { ProjectState } from './project.state'
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
import { ProjectDto } from '../../dto/project.dto'
import { ofActionSuccessful } from '@ngxs/store'
import { ProjectModel } from '../../../../../shared/util-model/model/project.model'
import { ProjectOptionModel } from '../../model/project-option.model'
import { DateUtil } from '../../../../../shared/util-tool/util/date.util'
import { FetchCurrentUser } from '../../../../../shared/util-common/state/registry.action'

@Injectable()
export class ProjectFacade extends GenericFacade {
    public get projectsPage (): Signal<PageModel<ProjectModel> | undefined> {
        return this.ngStore.selectSignal( ProjectState.projectsPage )
    }

    public get projectsPageLoading (): Signal<boolean> {
        return computed( (): boolean => this.ngStore.selectSignal( ProjectState.projectsPageLoading )() )
    }

    public get projectsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ProjectState.projectsPageSilentLoading )
    }

    public get projectsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ProjectState.projectsPageError )
    }

    private get projectsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ProjectState.projectsPageResetSearch )
    }

    public get projectsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ProjectState.projectsPageTextSearchedParam )
    }

    public get projectsPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined => DateUtil.buildDate( this.ngStore.selectSignal( ProjectState.projectsPageDateTimeSearchedParam )() ) )
    }

    public get projectsPageWithProfileSearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ProjectState.projectsPageWithProfileSearchedParam )
    }

    public get projectsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ProjectState.projectsPageVisibilitySearchedParam )
    }

    public get projectOptionsMetadata (): Signal<ProjectOptionModel[]> {
        return this.ngStore.selectSignal( ProjectState.projectOptionsMetadata )
    }

    public get projectOptionsMetadata$ (): Observable<ProjectOptionModel[]> {
        return this.ngStore.select( ProjectState.projectOptionsMetadata )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ProjectState.visibilitiesMetadata )().map( (item: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...item,
                label: this.translateService.instant( item.label! ),
            }) ),
        )
    }

    public get project (): Signal<ProjectModel | undefined> {
        return this.ngStore.selectSignal( ProjectState.project )
    }

    public get project$ (): Observable<ProjectModel | undefined> {
        return this.ngStore.select( ProjectState.project )
    }

    public get projectLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ProjectState.projectLoading )
    }

    public fetchProjectOptions (): void {
        this.ngStore.dispatch( FetchProjectOptions )
    }

    public startProjectsPageLoader (): void {
        this.ngStore.dispatch( StartProjectsPageLoader )
    }

    public stopProjectsPageLoader (): void {
        this.ngStore.dispatch( StopProjectsPageLoader )
    }

    public fetchProjectsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.projectsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchProjectsPage( index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        withProfile: boolean,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.projectsPageTextSearchedParam() != textSearched
                                     || this.projectsPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.projectsPageWithProfileSearchedParam() != withProfile
                                     || this.projectsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateProjectsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                withProfile: withProfile,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startProjectLoader (): void {
        this.ngStore.dispatch( StartProjectLoader )
    }

    public stopProjectLoader (): void {
        this.ngStore.dispatch( StopProjectLoader )
    }

    public fetchProject (id: string): void {
        this.ngStore.dispatch( new FetchProject( id ) )
    }

    public resetProject (): void {
        this.ngStore.dispatch( ResetProject )
    }

    public createProject (project: ProjectDto): Observable<FetchCurrentUser> {
        this.ngStore.dispatch( new CreateProject( project ) )

        return this.actions$.pipe( ofActionSuccessful( FetchCurrentUser ) )
    }

    public updateProject (
        id: string,
        project: ProjectDto,
    ): Observable<UpdateProject> {
        this.ngStore.dispatch( new UpdateProject( id, project ) )

        return this.actions$.pipe( ofActionSuccessful( UpdateProject ) )
    }

    public disableProject (id: string): void {
        this.ngStore.dispatch( new DisableProject( id ) )
    }

    public enableProject (id: string): void {
        this.ngStore.dispatch( new EnableProject( id ) )
    }

    public deleteProject (element: ProjectModel): void {
        this.ngStore.dispatch( new DeleteProject( element ) )
    }
}
