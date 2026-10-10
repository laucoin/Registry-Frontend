import { FieldTree, FormField } from '@angular/forms/signals'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { InvitationsListSearchModel, toInvitationsListSearchModel, toInvitationsListSearchParams } from './invitations-list.search'
import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {DatePicker} from 'primeng/datepicker'
import {Button} from 'primeng/button'
import {
    ProjectProfileElementComponent,
} from '@shared/ui/domain/project-profile-element/project-profile-element.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {StringHelper} from '@shared/helpers/string.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {RouterLink} from '@angular/router'

/**
 * Purpose: Page listing the invitations with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-invitations-list',
    imports: [
        TranslocoPipe,
        InputTextModule,
        ToggleButtonModule,
        FormField,
        ListComponent,
        DatePicker,
        Button,
        ProjectProfileElementComponent,
        RegistryTemplateDirective,
        RouterLink,
    ],
    templateUrl: './invitations-list.page.html',
})
export class InvitationsListPage extends GenericListComponent {
    protected readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)
    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringHelper.isNotNullNorBlank(this.userProfileFacade.userProjectProfileInvitationsPageTextSearchParam())
        || GenericHelper.nonNull(this.userProfileFacade.userProjectProfileInvitationsPageDateTimeSearchParam()),
    )

    protected readonly model: WritableSignal<InvitationsListSearchModel> = signal( toInvitationsListSearchModel( {
        textSearched: this.userProfileFacade.userProjectProfileInvitationsPageTextSearchParam(),
        dateTimeSearched: this.userProfileFacade.userProjectProfileInvitationsPageDateTimeSearchParam(),
    } ) )
    protected readonly form: FieldTree<InvitationsListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.userProfileFacade.fetchProjectProfileInvitationPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toInvitationsListSearchParams> = toInvitationsListSearchParams( this.model() )
        this.userProfileFacade.inputInvitationsPageSearchParameters(search.textSearched, search.dateTimeSearched)
        this.userProfileFacade.fetchProjectProfileInvitationPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
