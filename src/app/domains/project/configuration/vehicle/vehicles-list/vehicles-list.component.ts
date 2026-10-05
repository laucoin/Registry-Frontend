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
import { VehicleFacade } from '../data/state/vehicle.facade'
import { VehicleElementComponent } from '../vehicle-element/vehicle-element.component'
import { VehicleRoutesEnum } from '../vehicle-routes.enum'

@Component({
	selector: 'app-vehicles-list',
	templateUrl: './vehicles-list.component.html',
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
		VehicleElementComponent,
		Select,
	],
})
export class VehiclesListComponent extends GenericListComponent {
	protected readonly facade: VehicleFacade = inject(VehicleFacade)

	protected readonly VehicleRoutesEnum: typeof VehicleRoutesEnum = VehicleRoutesEnum

	public constructor() {
		super()

		this.form = this.initForm()

		this.loadData()
	}

	protected initForm(): FormGroup {
		return this.formBuilder.group({
			textSearched: this.formBuilder.control(this.facade.vehiclesPageTextSearchedParam()),
			dateTimeSearched: this.formBuilder.control(this.facade.vehiclesPageDateTimeSearchedParam()),
			statusSearched: this.formBuilder.control(this.facade.vehiclesPageStatusSearchedParam()),
			visibilitySearched: this.formBuilder.control(this.facade.vehiclesPageVisibilitySearchedParam()),
		})
	}

	protected loadData(): void {
		this.facade.fetchVehiclesPage(undefined, undefined, false)
	}

	protected loadPage(pageEvent: PageEventModel): void {
		this.facade.inputPageSearchParameters(
			this.textSearched.value,
			this.dateTimeSearched.value,
			this.statusSearched.value,
			this.visibilitySearched.value,
		)
		this.facade.fetchVehiclesPage(pageEvent.pageNumber, pageEvent.pageSize, false)
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

	protected get visibilitySearched(): FormControl {
		return this.form.get('visibilitySearched') as FormControl
	}
}
