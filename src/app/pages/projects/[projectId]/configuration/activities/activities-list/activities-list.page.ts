import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { ActivitiesListSearchModel, toActivitiesListSearchModel, toActivitiesListSearchParams } from './activities-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {RouterLink} from '@angular/router'
import {ActivityRoutesEnum} from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {ActivityElementComponent} from '@pages/projects/[projectId]/configuration/activities/activity-element/activity-element.component'
import {Select, SelectModule} from 'primeng/select'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

/**
 * Purpose: Page listing the activities with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-activities-list',
    templateUrl: './activities-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        FormField,
        TranslocoPipe,
        InputTextModule,
        SelectModule,
        ToggleButtonModule,
        RouterLink,
        Button,
        DatePicker,
        ActivityElementComponent,
        Select,
    ],
})
export class ActivitiesListPage extends GenericListComponent {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)

    protected readonly ActivityRoutesEnum: typeof ActivityRoutesEnum = ActivityRoutesEnum

    protected readonly model: WritableSignal<ActivitiesListSearchModel> = signal( toActivitiesListSearchModel( {
        textSearched: this.facade.activitiesPageTextSearchedParam(),
        dateTimeSearched: this.facade.activitiesPageDateTimeSearchedParam(),
        availabilitySearched: this.facade.activitiesPageAvailabilitySearchedParam(),
        visibilitySearched: this.facade.activitiesPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<ActivitiesListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
    }

    protected loadData(): void {
        this.facade.fetchActivitiesPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toActivitiesListSearchParams> = toActivitiesListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.textSearched,
            search.dateTimeSearched,
            search.availabilitySearched,
            search.visibilitySearched,
        )
        this.facade.fetchActivitiesPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
