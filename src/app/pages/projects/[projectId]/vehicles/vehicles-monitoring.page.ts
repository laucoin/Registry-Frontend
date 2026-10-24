import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import {
    toVehiclesListSearchModel,
    toVehiclesListSearchParams,
    VehiclesListSearchModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper'
import { StringHelper } from '@shared/helpers/string.helper'
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component'
import { ProjectVehicleOverviewComponent } from '@shared/ui/domain/project-vehicle-overview/project-vehicle-overview.component'

const PAGE_SIZE: number = 20

/**
 * Purpose: Page de suivi de l'endroit où se trouvent les véhicules du projet.
 * Scope: Affiche les compteurs de véhicules sur ordinateur au-dessus d'une liste interrogeable des véhicules avec leur statut de présence et un déclencheur « charger plus ».
 * Limits: Ne détient aucun état de domaine ; la facade des véhicules le possède. Accessible uniquement quand le projet a l'option véhicule.
 */
@Component({
    selector: 'app-vehicles-monitoring',
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    providers: [ provideTranslocoScope( 'project-home' ) ],
    imports: [
        TranslocoPipe,
        FormField,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        ListComponent,
        MonitoringRowComponent,
        ProjectVehicleOverviewComponent,
    ],
    templateUrl: './vehicles-monitoring.page.html',
})
export class VehiclesMonitoringPage {
    protected readonly facade: VehicleFacade = inject( VehicleFacade )

    protected readonly activeFilters: Signal<number> = computed( (): number => [
        StringHelper.isNotNullNorBlank( this.facade.vehiclesPageQueryParam() ),
        this.facade.vehiclesPageStatusParam() !== undefined,
    ].filter( Boolean ).length )

    protected readonly model: WritableSignal<VehiclesListSearchModel> = signal( toVehiclesListSearchModel( {
        q: this.facade.vehiclesPageQueryParam(),
        at: this.facade.vehiclesPageAtParam(),
        status: this.facade.vehiclesPageStatusParam(),
        isVisible: undefined,
    } ) )
    protected readonly form: FieldTree<VehiclesListSearchModel> = createSearchForm( this.model )

    public constructor () {
        this.facade.fetchVehiclesPage( undefined, PAGE_SIZE )
    }

    protected rowOf (vehicle: VehicleModel): MonitoringRowModel {
        return MonitoringRowHelper.fromVehicle( vehicle )
    }

    protected search (): void {
        const search: ReturnType<typeof toVehiclesListSearchParams> = toVehiclesListSearchParams( this.model() )
        this.facade.inputPageSearchParameters( search.q, search.at, search.status, undefined )
        this.facade.fetchVehiclesPage( 0, PAGE_SIZE )
    }

    protected resetFilters (): void {
        this.model.set( { q: '', at: null, status: '', isVisible: '' } )
        this.search()
    }

    protected loadBatch (pageEvent: PageEventModel): void {
        this.facade.fetchVehiclesPage( pageEvent.page, pageEvent.size )
    }
}
