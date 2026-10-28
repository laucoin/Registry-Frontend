import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink, RouterOutlet } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileRoutesEnum } from '@pages/projects/[projectId]/configuration/profiles/project-profile-routes.enum'
import { ProjectProfileRowComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-row.component'
import {
    ProjectProfilesListSearchModel,
    toProjectProfilesListSearchModel,
    toProjectProfilesListSearchParams,
} from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

/**
 * Purpose: Page listant les profils de projet du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des profils de projet, possède le formulaire de recherche et donne à la liste le template de ligne d'un profil de projet.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-project-profiles-list',
    imports: [
        ListComponent,
        ProjectProfileRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        RouterOutlet,
        BooleanChoicePipe,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './project-profiles-list.page.html',
})
export class ProjectProfilesListPage {
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly inviteRoute: ProjectProfileRoutesEnum = ProjectProfileRoutesEnum.INVITE

    protected readonly canInvite: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.projectProfilesPageQueryParam()),
        this.facade.projectProfilesPageAtParam() !== undefined,
        this.facade.projectProfilesPageStatusParam() !== undefined,
        this.facade.projectProfilesPageIsAvailableParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ProjectProfilesListSearchModel> = signal(toProjectProfilesListSearchModel({
        q: this.facade.projectProfilesPageQueryParam(),
        at: this.facade.projectProfilesPageAtParam(),
        status: this.facade.projectProfilesPageStatusParam(),
        isAvailable: this.facade.projectProfilesPageIsAvailableParam(),
    }))
    protected readonly form: FieldTree<ProjectProfilesListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchProjectProfilesPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toProjectProfilesListSearchParams> = toProjectProfilesListSearchParams(this.model())
        this.facade.inputPageSearchParameters(
            search.q,
            search.at,
            search.status as ProfileStatusEnum | undefined,
            search.isAvailable,
        )
        this.facade.fetchProjectProfilesPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ q: '', at: null, status: '', isAvailable: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchProjectProfilesPage(pageEvent.page, pageEvent.size)
    }
}
