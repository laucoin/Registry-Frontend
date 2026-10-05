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
import {
	ProjectProfileElementComponent,
} from '../../../../../shared/util-ui/project-profile-element/project-profile-element.component'
import { ProjectProfileFacade } from '../data/state/project-profile.facade'
import { ProjectProfileRoutesEnum } from '../project-profile-routes.enum'

@Component({
	selector: 'app-project-profiles-list',
	templateUrl: './project-profiles-list.component.html',
	imports: [
		ListComponent,
		RegistryTemplateDirective,
		ReactiveFormsModule,
		TranslatePipe,
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
export class ProjectProfilesListComponent extends GenericListComponent {
	protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)

	protected readonly ProjectProfileRoutesEnum: typeof ProjectProfileRoutesEnum = ProjectProfileRoutesEnum

	public constructor() {
		super()

		this.form = this.initForm()

		this.loadData()
	}

	protected initForm(): FormGroup {
		return this.formBuilder.group({
			textSearched: this.formBuilder.control(this.facade.projectProfilesPageTextSearchedParam()),
			dateTimeSearched: this.formBuilder.control(this.facade.projectProfilesPageDateTimeSearchedParam()),
			statusSearched: this.formBuilder.control(this.facade.projectProfilesPageStatusSearchedParam()),
			availabilitySearched: this.formBuilder.control(this.facade.projectProfilesPageAvailabilitySearchedParam()),
		})
	}

	protected loadData(): void {
		this.facade.fetchProjectProfilesPage(undefined, undefined, false)
	}

	protected loadPage(pageEvent: PageEventModel): void {
		this.facade.inputPageSearchParameters(
			this.textSearched.value,
			this.dateTimeSearched.value,
			this.statusSearched.value,
			this.availabilitySearched.value,
		)
		this.facade.fetchProjectProfilesPage(pageEvent.pageNumber, pageEvent.pageSize, false)
	}

	protected get textSearched(): FormControl {
		return this.form.get('textSearched') as FormControl
	}

	protected get dateTimeSearched(): FormControl {
		return this.form.get('dateTimeSearched') as FormControl
	}

	protected get statusSearched(): FormControl {
		return this.form.get('statusSearched') as FormControl
	}

	protected get availabilitySearched(): FormControl {
		return this.form.get('availabilitySearched') as FormControl
	}
}
