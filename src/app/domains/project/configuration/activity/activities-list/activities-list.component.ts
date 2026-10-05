import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { InputTextModule } from 'primeng/inputtext'
import { Select, SelectModule } from 'primeng/select'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { PageEventModel } from '../../../../../shared/util-model/model/page-event.model'
import { GenericListComponent } from '../../../../../shared/util-tool/component/generic-list.component'
import { RegistryTemplateDirective } from '../../../../../shared/util-tool/directive/registry-template.directive'
import { ListComponent } from '../../../../../shared/util-ui/list/list.component'
import { ActivityElementComponent } from '../activity-element/activity-element.component'
import { ActivityRoutesEnum } from '../activity-routes.enum'
import { ActivityFacade } from '../data/state/activity.facade'

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
