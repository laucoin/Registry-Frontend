import { FieldTree, FormField } from '@angular/forms/signals'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { ProfilesListSearchModel, toProfilesListSearchModel, toProfilesListSearchParams } from './profiles-list.search'
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
import {ProjectProfileFacade} from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import {Select} from 'primeng/select'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {StringHelper} from '@shared/helpers/string.helper'
import {RouterLink} from '@angular/router'

/**
 * Purpose: Page listing the profiles with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-profiles-list',
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
        Select,
        RouterLink,

    ],
    templateUrl: './profiles-list.page.html',
})
export class ProfilesListPage extends GenericListComponent {
    protected readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)

    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringHelper.isNotNullNorBlank(this.userProfileFacade.userProjectProfilesPageTextSearchParam())
        || GenericHelper.nonNull(this.userProfileFacade.userProjectProfilesPageDateTimeSearchParam())
        || GenericHelper.nonNull(this.userProfileFacade.userProjectProfilesPageAvailabilitySearchParam()),
    )

    protected readonly model: WritableSignal<ProfilesListSearchModel> = signal( toProfilesListSearchModel( {
        textSearched: this.userProfileFacade.userProjectProfilesPageTextSearchParam(),
        dateTimeSearched: this.userProfileFacade.userProjectProfilesPageDateTimeSearchParam(),
        availabilitySearched: this.userProfileFacade.userProjectProfilesPageAvailabilitySearchParam(),
    } ) )
    protected readonly form: FieldTree<ProfilesListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.userProfileFacade.fetchProjectProfilesPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toProfilesListSearchParams> = toProfilesListSearchParams( this.model() )
        this.userProfileFacade.inputProfilesPageSearchParameters(
            search.textSearched,
            search.availabilitySearched,
            search.dateTimeSearched,
        )
        this.userProfileFacade.fetchProjectProfilesPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
