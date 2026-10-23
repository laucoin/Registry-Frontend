import { Component, inject} from '@angular/core'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {VehicleFacade} from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {RouterLink} from '@angular/router'
import {VehicleRoutesEnum} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-routes.enum'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {VehicleElementComponent} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-element/vehicle-element.component'
import {Select, SelectModule} from 'primeng/select'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

/**
 * Purpose: Page listing the vehicles with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-vehicles-list',
    templateUrl: './vehicles-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslocoPipe,
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
export class VehiclesListPage extends GenericListComponent {
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
        this.facade.fetchVehiclesPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.statusSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchVehiclesPage(pageEvent.pageNumber, pageEvent.pageSize)
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
