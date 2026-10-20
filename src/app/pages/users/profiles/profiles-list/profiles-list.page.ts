import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileRowComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-row.component'
import { ProfilesListSearchModel, toProfilesListSearchModel, toProfilesListSearchParams } from '@pages/users/profiles/profiles-list/profiles-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

/**
 * Purpose: Page listing the project profiles of the signed-in user with search and a "load more" trigger.
 * Scope: Binds the list component to the user profile facade, owns the search form and gives the list the row template of a project profile.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-profiles-list',
    imports: [
        ListComponent,
        ProjectProfileRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        BooleanChoicePipe,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './profiles-list.page.html',
    styles: ':host { display: block; width: 100%; }',
})
export class ProfilesListPage {
    protected readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)

    protected readonly createRoute: string = `/${RegistryRouteEnum.PROJECTS_CREATION}`
    protected readonly invitationsRoute: string = `/${RegistryRouteEnum.MY_ACCOUNT_INVITATIONS}`

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.userProfileFacade.userProjectProfilesPageQueryParam()),
        this.userProfileFacade.userProjectProfilesPageAtParam() !== undefined,
        this.userProfileFacade.userProjectProfilesPageIsAvailableParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ProfilesListSearchModel> = signal(toProfilesListSearchModel({
        q: this.userProfileFacade.userProjectProfilesPageQueryParam(),
        at: this.userProfileFacade.userProjectProfilesPageAtParam(),
        isAvailable: this.userProfileFacade.userProjectProfilesPageIsAvailableParam(),
    }))
    protected readonly form: FieldTree<ProfilesListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.userProfileFacade.fetchProjectProfilesPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toProfilesListSearchParams> = toProfilesListSearchParams(this.model())
        this.userProfileFacade.inputProfilesPageSearchParameters(search.q, search.isAvailable, search.at)
        this.userProfileFacade.fetchProjectProfilesPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ q: '', at: null, isAvailable: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.userProfileFacade.fetchProjectProfilesPage(pageEvent.page, pageEvent.size)
    }
}
