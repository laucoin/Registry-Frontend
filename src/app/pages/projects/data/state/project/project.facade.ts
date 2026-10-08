import { computed, inject, Injectable, Signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { finalize, Observable, switchMap, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { ProjectDto } from '@pages/projects/data/dto/project.dto'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { initialize, notifyOnError } from '@shared/helpers/rx.helper'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { DateHelper } from '@shared/helpers/date.helper'

@Injectable()
export class ProjectFacade extends GenericFacade {
    private readonly store: InstanceType<typeof ProjectStore> = inject( ProjectStore )
    private readonly api: ProjectApi = inject( ProjectApi )
    private readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    private readonly uiFacade: UiFacade = inject( UiFacade )
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )

    public readonly projectsPage: Signal<PageModel<ProjectModel> | undefined> = this.store.projects.element

    public readonly projectsPageLoading: Signal<boolean> = this.store.projects.loading

    public readonly projectsPageSilentLoading: Signal<boolean> = this.store.projects.silentLoading

    public readonly projectsPageError: Signal<ToastMessageOptions | undefined> = this.store.projects.error

    private readonly projectsPageResetSearch: Signal<boolean> = this.store.projects.params.resetSearch

    public readonly projectsPageTextSearchedParam: Signal<string | undefined> = this.store.projects.params.textSearched

    public readonly projectsPageDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined => DateHelper.buildDate( this.store.projects.params.dateTimeSearched() ) )

    public readonly projectsPageWithProfileSearchedParam: Signal<boolean | undefined> = this.store.projects.params.withProfile

    public readonly projectsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.projects.params.visibilitySearched

    public readonly projectOptionsMetadata: Signal<ProjectOptionModel[]> = this.store.metadata.options

    public readonly projectOptionsMetadata$: Observable<ProjectOptionModel[]> = toObservable( this.projectOptionsMetadata )

    public readonly visibilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( (): SelectItem<boolean | undefined>[] =>
            this.store.metadata.visibilities().map( (item: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...item,
                label: this.translateLabel( item.label! ),
            }) ),
        )

    public readonly project: Signal<ProjectModel | undefined> = this.store.project.element

    public readonly createdProjectId: Signal<string | undefined> = this.store.createdProjectId

    public readonly project$: Observable<ProjectModel | undefined> = toObservable( this.project )

    public readonly projectLoading: Signal<boolean> = this.store.project.loading

    public fetchProjectOptions (): void {
        this.store.fetchProjectOptions()
    }

    public fetchProjectsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.projectsPageResetSearch() ? 0 : pageNumber
        this.store.fetchProjectsPage( { pageNumber: index, pageSize: pageSize } )
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
            this.store.updateProjectsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                withProfile: withProfile,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } )
        }
    }

    public fetchProject (id: string): void {
        this.store.fetchProject( id )
    }

    public resetProject (): void {
        this.store.resetProject()
    }

    public createProject (project: ProjectDto): Observable<unknown> {
        return this.api.createProject( project ).pipe(
            this.trackProjectLoader,
            notifyOnError( this.uiFacade ),
            tap( (created: ProjectModel): void => {
                this.store.setCreatedProjectId( created.id )
                this.onCommandSuccess( 'create', created )
            } ),
            switchMap( (): Observable<unknown> => this.registryFacade.fetchCurrentUser() ),
        )
    }

    public updateProject (id: string, project: ProjectDto): Observable<ProjectModel> {
        return this.api.updateProjectById( id, project ).pipe(
            this.trackProjectLoader,
            notifyOnError( this.uiFacade ),
            tap( (updated: ProjectModel): void => {
                this.onCommandSuccess( 'edit', updated )
                if (this.sessionFacade.currentProjectId() == updated.id) {
                    this.registryFacade.fetchCurrentUser()
                }
            } ),
        )
    }

    public disableProject (id: string): void {
        this.api.disableProjectById( id ).pipe(
            this.trackProjectLoader,
            notifyOnError( this.uiFacade ),
            tap( (project: ProjectModel): void => this.onCommandSuccess( 'disable', project, true ) ),
        ).subscribe()
    }

    public enableProject (id: string): void {
        this.api.enableProjectById( id ).pipe(
            this.trackProjectLoader,
            notifyOnError( this.uiFacade ),
            tap( (project: ProjectModel): void => this.onCommandSuccess( 'enable', project, true ) ),
        ).subscribe()
    }

    public deleteProject (element: ProjectModel): void {
        this.api.deleteProjectById( element.id ).pipe(
            this.trackProjectLoader,
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', element, true ) ),
        ).subscribe()
    }

    private readonly trackProjectLoader = <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => this.store.startProjectLoader() ),
        finalize( (): void => this.store.stopProjectLoader() ),
    )

    private onCommandSuccess (command: string, project: ProjectModel, refreshUser: boolean = false): void {
        this.uiFacade.notify( StateHelper.buildNotificationMessage(
            SeverityEnum.SUCCESS,
            `projects.notifications.${ command }.title`,
            `projects.notifications.${ command }.message`,
            'pi pi-calendar',
            { name: project.name },
        ) )

        if (refreshUser) {
            this.registryFacade.fetchCurrentUser()
        }

        const page: PageModel<ProjectModel> | undefined = this.projectsPage()
        this.fetchProjectsPage( page?.pageNumber, page?.pageSize )
    }
}
