import { Component, computed, inject, Signal } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { InputTextModule } from 'primeng/inputtext'
import { Select } from 'primeng/select'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { ToggleSwitch } from 'primeng/toggleswitch'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { StringUtil } from '../../../shared/util-tool/util/string.util'
import { InfoComponent } from '../../../shared/util-ui/info/info.component'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { ProjectFacade } from '../data/state/project/project.facade'
import { ProjectElementComponent } from '../project-element/project-element.component'
import { ProjectRoutesEnum } from '../project-routes.enum'

@Component({
	selector: 'app-projects-list',
	imports: [
		ListComponent,
		RegistryTemplateDirective,
		ProjectElementComponent,
		Button,
		FormsModule,
		InputTextModule,
		ToggleButtonModule,
		TranslatePipe,
		ReactiveFormsModule,
		RouterLink,
		Select,
		DatePicker,
		ToggleSwitch,
		InfoComponent,
	],
	templateUrl: './projects-list.component.html',
})
export class ProjectsListComponent extends GenericListComponent {
	protected readonly facade: ProjectFacade = inject(ProjectFacade)

	protected readonly ProjectRoutesEnum: typeof ProjectRoutesEnum = ProjectRoutesEnum

	protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
		StringUtil.isNotNullNorBlank(this.facade.projectsPageTextSearchedParam())
		|| GenericUtil.nonNull(this.facade.projectsPageDateTimeSearchedParam())
		|| GenericUtil.nonNull(this.facade.projectsPageVisibilitySearchedParam()),
	)

	public constructor() {
		super()

		this.form = this.initForm()

		this.facade.fetchProjectsPage(undefined, undefined, false)
	}

	protected initForm(): FormGroup {
		return this.formBuilder.group({
			textSearched: this.formBuilder.control(this.facade.projectsPageTextSearchedParam()),
			dateTimeSearched: this.formBuilder.control(this.facade.projectsPageDateTimeSearchedParam()),
			withProfile: this.formBuilder.control(this.facade.projectsPageWithProfileSearchedParam()),
			visibilitySearched: this.formBuilder.control(this.facade.projectsPageVisibilitySearchedParam()),
		})
	}

	protected loadPage(pageEvent: PageEventModel): void {
		this.facade.inputPageSearchParameters(
			this.textSearched.value,
			this.dateTimeSearched.value,
			this.withProfile.value,
			this.visibilitySearched.value,
		)
		this.facade.fetchProjectsPage(pageEvent.pageNumber, pageEvent.pageSize, false)
	}

	protected get textSearched(): FormControl {
		return this.form.get('textSearched') as FormControl
	}

	protected get dateTimeSearched(): FormControl {
		return this.form.get('dateTimeSearched') as FormControl
	}

	protected get withProfile(): FormControl {
		return this.form.get('withProfile') as FormControl
	}

	protected get visibilitySearched(): FormControl {
		return this.form.get('visibilitySearched') as FormControl
	}
}
