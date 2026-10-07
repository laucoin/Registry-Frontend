import { Component, inject} from '@angular/core'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {ListComponent} from '@shared/ui/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {RouterLink} from '@angular/router'
import {ActivityRoutesEnum} from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {ActivityElementComponent} from '@pages/projects/[projectId]/configuration/activities/activity-element/activity-element.component'
import {Select, SelectModule} from 'primeng/select'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

@Component({
    selector: 'app-activities-list',
    templateUrl: './activities-list.component.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslatePipe,
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
export class ActivitiesListComponent extends GenericListComponent {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)

    protected readonly ActivityRoutesEnum: typeof ActivityRoutesEnum = ActivityRoutesEnum

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.facade.activitiesPageTextSearchedParam()),
            dateTimeSearched: this.formBuilder.control(this.facade.activitiesPageDateTimeSearchedParam()),
            availabilitySearched: this.formBuilder.control(this.facade.activitiesPageAvailabilitySearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.activitiesPageVisibilitySearchedParam()),
        })
    }

    protected loadData(): void {
        this.facade.fetchActivitiesPage(undefined, undefined, false)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.availabilitySearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchActivitiesPage(pageEvent.pageNumber, pageEvent.pageSize, false)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get dateTimeSearched(): FormControl {
        return this.form.get('dateTimeSearched') as FormControl
    }

    protected get availabilitySearched(): FormControl {
        return this.form.get('availabilitySearched') as FormControl
    }

    protected get visibilitySearched(): FormControl {
        return this.form.get('visibilitySearched') as FormControl
    }
}
