import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/dialog'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import '@sgdf/ui/switch'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum'
import { ProjectActions } from '@pages/projects/projects-list/project-actions.service'
import {
    ProjectsListSearchModel,
    toProjectsListSearchModel,
    toProjectsListSearchParams,
} from '@pages/projects/projects-list/projects-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { InfoComponent } from '@shared/ui/common/info/info.component'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh'

const INITIALS_LENGTH: number = 2

/**
 * Purpose: Page listing the projects the user can see, with search and a "load more" trigger.
 * Scope: Binds the list component to the project facade, owns the search form and the projects shown in the options and hidden-project dialogs.
 * Limits: Holds no domain state and never calls the backend; commands on a project are delegated to ProjectActions.
 */
@Component({
    selector: 'app-projects-list',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        InfoComponent,
        ElementActionsComponent,
        TranslocoPipe,
        FormField,
        RouterLink,
        CustomDateFormatPipe,
        PluralTranslationPipe,
        BooleanChoicePipe,
        FavoriteToggleComponent,
    ],
    providers: [ProjectActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    styleUrl: './projects-list.page.css',
    templateUrl: './projects-list.page.html',
})
export class ProjectsListPage {
    protected readonly facade: ProjectFacade = inject(ProjectFacade)
    protected readonly projectActions: ProjectActions = inject(ProjectActions)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)
    private readonly autoRefresh: void = injectAutoRefresh('projects/list', 'counts', (): void => this.facade.refreshProjectsPage())

    protected readonly createRoute: typeof ProjectRoutesEnum.CREATE = ProjectRoutesEnum.CREATE
    protected readonly optionsProject: WritableSignal<ProjectModel | undefined> = signal(undefined)
    protected readonly hiddenProject: WritableSignal<ProjectModel | undefined> = signal(undefined)

    protected readonly canCreate: Signal<boolean> = this.canWith(UserAuthorityEnum.REGISTRY_PROJECT_C)

    protected readonly canReadAll: Signal<boolean> = this.canWith(UserAuthorityEnum.REGISTRY_PROJECT_R)

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.projectsPageQueryParam()),
        this.facade.projectsPageAtParam() !== undefined,
        this.facade.projectsPageIsVisibleParam() !== undefined,
        this.facade.projectsPageIsFavoriteParam() !== undefined,
        this.canReadAll() && this.facade.projectsPageWithProfileParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ProjectsListSearchModel> = signal(toProjectsListSearchModel({
        q: this.facade.projectsPageQueryParam(),
        at: this.facade.projectsPageAtParam(),
        isVisible: this.facade.projectsPageIsVisibleParam(),
        isFavorite: this.facade.projectsPageIsFavoriteParam(),
        withProfile: this.facade.projectsPageWithProfileParam(),
    }))
    protected readonly form: FieldTree<ProjectsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchProjectsPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toProjectsListSearchParams> = toProjectsListSearchParams(this.model())
        this.facade.inputPageSearchParameters(
            search.q,
            search.at,
            search.isVisible,
            search.isFavorite,
            this.canReadAll() ? search.withProfile : undefined,
        )
        this.facade.fetchProjectsPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.update((model: ProjectsListSearchModel): ProjectsListSearchModel => ({
            ...model,
            q: '',
            at: null,
            isVisible: '',
            isFavorite: '',
            withProfile: '',
        }))
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchProjectsPage(pageEvent.page, pageEvent.size)
    }

    protected toggleFavorite(project: ProjectModel): void {
        this.facade.toggleFavorite(project)
    }

    protected initials(project: ProjectModel): string {
        const words: string[] = project.name.trim().split(/\s+/)
        const letters: string = words.length > 1 ? words.slice(0, INITIALS_LENGTH).map((word: string): string => word[0]).join('') : words[0].slice(0, INITIALS_LENGTH)
        return letters.toUpperCase()
    }

    protected isAvailable(project: ProjectModel): boolean {
        return project.status?.value === AvailabilityStatusEnum.AVAILABLE
    }

    protected closeDialog(event: Event, shown: WritableSignal<ProjectModel | undefined>): void {
        if (event.target === event.currentTarget) {
            shown.set(undefined)
        }
    }

    private canWith(authority: UserAuthorityEnum): Signal<boolean> {
        return computed((): boolean => CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), authority))
    }
}
