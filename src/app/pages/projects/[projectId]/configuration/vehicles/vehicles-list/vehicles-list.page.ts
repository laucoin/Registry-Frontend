import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { VehiclesListSearchModel, toVehiclesListSearchModel, toVehiclesListSearchParams } from './vehicles-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
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
        FormField,
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

    protected readonly model: WritableSignal<VehiclesListSearchModel> = signal( toVehiclesListSearchModel( {
        textSearched: this.facade.vehiclesPageTextSearchedParam(),
        dateTimeSearched: this.facade.vehiclesPageDateTimeSearchedParam(),
        statusSearched: this.facade.vehiclesPageStatusSearchedParam(),
        visibilitySearched: this.facade.vehiclesPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<VehiclesListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
    }

    protected loadData(): void {
        this.facade.fetchVehiclesPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toVehiclesListSearchParams> = toVehiclesListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.textSearched,
            search.dateTimeSearched,
            search.statusSearched,
            search.visibilitySearched,
        )
        this.facade.fetchVehiclesPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
