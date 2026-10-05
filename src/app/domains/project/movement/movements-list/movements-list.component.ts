import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { InputTextModule } from 'primeng/inputtext'
import { Select, SelectModule } from 'primeng/select'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { PageEventModel } from '../../../../shared/util-model/model/page-event.model'
import { GenericListComponent } from '../../../../shared/util-tool/component/generic-list.component'
import { RegistryTemplateDirective } from '../../../../shared/util-tool/directive/registry-template.directive'
import { ListComponent } from '../../../../shared/util-ui/list/list.component'
import { MovementElementComponent } from '../../../../shared/util-ui/movement-element/movement-element.component'
import { MovementFacade } from '../data/state/movement.facade'
import { MovementRoutesEnum } from '../movement-routes.enum'

@Component({
	selector: 'app-movements-list',
	templateUrl: './movements-list.component.html',
	imports: [
		ListComponent,
		RegistryTemplateDirective,
		ReactiveFormsModule,
		TranslatePipe,
		InputTextModule,
		ToggleButtonModule,
		SelectModule,
		MovementElementComponent,
		RouterLink,
		Select,
		Button,
		DatePicker,
	],
})
export class MovementsListComponent extends GenericListComponent {
	protected readonly facade: MovementFacade = inject(MovementFacade)

	protected readonly MovementRoutesEnum: typeof MovementRoutesEnum = MovementRoutesEnum

	public constructor() {
		super()

		this.form = this.initForm()

		this.loadData()
	}

	protected initForm(): FormGroup {
		return this.formBuilder.group({
			typeSearched: this.formBuilder.control(this.facade.movementsPageTypeSearchedParam()),
			startDateTimeSearched: this.formBuilder.control(this.facade.movementsPageStartDateTimeSearchedParam()),
			endDateTimeSearched: this.formBuilder.control(this.facade.movementsPageEndDateTimeSearchedParam()),
			visibilitySearched: this.formBuilder.control(this.facade.movementsPageVisibilitySearchedParam()),
		})
	}

	protected loadData(): void {
		this.facade.fetchMovementsPage(undefined, undefined, false)
	}

	protected loadPage(pageEvent: PageEventModel): void {
		this.facade.inputPageSearchParameters(
			this.typeSearched.value,
			this.startDateTimeSearched.value,
			this.endDateTimeSearched.value,
			this.visibilitySearched.value,
		)
		this.facade.fetchMovementsPage(pageEvent.pageNumber, pageEvent.pageSize, false)
	}

	protected get typeSearched(): FormControl {
		return this.form.get('typeSearched') as FormControl
	}

	protected get startDateTimeSearched(): FormControl {
		return this.form.get('startDateTimeSearched') as FormControl
	}

	protected get endDateTimeSearched(): FormControl {
		return this.form.get('endDateTimeSearched') as FormControl
	}

	protected get visibilitySearched(): FormControl {
		return this.form.get('visibilitySearched') as FormControl
	}
}
