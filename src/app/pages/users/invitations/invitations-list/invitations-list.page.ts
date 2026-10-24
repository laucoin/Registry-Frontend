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
import '@sgdf/ui/page-title'
import { ProjectProfileRowComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-row.component'
import { InvitationsListSearchModel, toInvitationsListSearchModel, toInvitationsListSearchParams } from '@pages/users/invitations/invitations-list/invitations-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { StringHelper } from '@shared/helpers/string.helper'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

/**
 * Purpose: Page listant les invitations de l'utilisateur connecté avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des profils utilisateur, possède le formulaire de recherche et donne à la liste le template de ligne d'un profil de projet.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-invitations-list',
    imports: [
        ListComponent,
        ProjectProfileRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './invitations-list.page.html',
    styles: ':host { display: block; width: 100%; }',
})
export class InvitationsListPage {
    protected readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)

    protected readonly createRoute: string = `/${RegistryRouteEnum.PROJECTS_CREATION}`
    protected readonly projectsRoute: string = `/${RegistryRouteEnum.PROJECTS}`

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.userProfileFacade.userProjectProfileInvitationsPageQueryParam()),
        this.userProfileFacade.userProjectProfileInvitationsPageAtParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<InvitationsListSearchModel> = signal(toInvitationsListSearchModel({
        q: this.userProfileFacade.userProjectProfileInvitationsPageQueryParam(),
        at: this.userProfileFacade.userProjectProfileInvitationsPageAtParam(),
    }))
    protected readonly form: FieldTree<InvitationsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.userProfileFacade.fetchProjectProfileInvitationPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toInvitationsListSearchParams> = toInvitationsListSearchParams(this.model())
        this.userProfileFacade.inputInvitationsPageSearchParameters(search.q, search.at)
        this.userProfileFacade.fetchProjectProfileInvitationPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ q: '', at: null })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.userProfileFacade.fetchProjectProfileInvitationPage(pageEvent.page, pageEvent.size)
    }
}
