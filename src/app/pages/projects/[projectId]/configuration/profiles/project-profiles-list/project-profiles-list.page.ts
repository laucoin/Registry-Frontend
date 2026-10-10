import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { ProjectProfilesListSearchModel, toProjectProfilesListSearchModel, toProjectProfilesListSearchParams } from './project-profiles-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ProjectProfileFacade} from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {
    ProjectProfileElementComponent,
} from '@shared/ui/domain/project-profile-element/project-profile-element.component'
import {RouterLink} from '@angular/router'
import {ProjectProfileRoutesEnum} from '@pages/projects/[projectId]/configuration/profiles/project-profile-routes.enum'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

/**
 * Purpose: Page listing the project profiles with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-project-profiles-list',
    templateUrl: './project-profiles-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        FormField,
        TranslocoPipe,
        InputTextModule,
        ToggleButtonModule,
        ProjectProfileElementComponent,
        SelectModule,
        RouterLink,
        Select,
        Button,
        DatePicker,
    ],
})
export class ProjectProfilesListPage extends GenericListComponent {
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)

    protected readonly ProjectProfileRoutesEnum: typeof ProjectProfileRoutesEnum = ProjectProfileRoutesEnum

    protected readonly model: WritableSignal<ProjectProfilesListSearchModel> = signal( toProjectProfilesListSearchModel( {
        textSearched: this.facade.projectProfilesPageTextSearchedParam(),
        dateTimeSearched: this.facade.projectProfilesPageDateTimeSearchedParam(),
        statusSearched: this.facade.projectProfilesPageStatusSearchedParam(),
        availabilitySearched: this.facade.projectProfilesPageAvailabilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<ProjectProfilesListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
    }

    protected loadData(): void {
        this.facade.fetchProjectProfilesPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toProjectProfilesListSearchParams> = toProjectProfilesListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.textSearched,
            search.dateTimeSearched,
            search.statusSearched as ProfileStatusEnum | undefined,
            search.availabilitySearched,
        )
        this.facade.fetchProjectProfilesPage(pageEvent.pageNumber, pageEvent.pageSize)
    }
}
