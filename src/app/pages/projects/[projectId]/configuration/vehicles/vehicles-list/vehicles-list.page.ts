import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleRoutesEnum } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-routes.enum'
import { VehicleRowComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/vehicle-row.component'
import {
    VehiclesListSearchModel,
    toVehiclesListSearchModel,
    toVehiclesListSearchParams,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

/**
 * Purpose: Page listing the vehicles of the selected project with search and a "load more" trigger.
 * Scope: Binds the list component to the group facade, owns the search form and gives the list the row template of a vehicle.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-vehicles-list',
    imports: [
        ListComponent,
        VehicleRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        BooleanChoicePipe,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './vehicles-list.page.html',
})
export class VehiclesListPage {
    protected readonly facade: VehicleFacade = inject(VehicleFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly createRoute: VehicleRoutesEnum = VehicleRoutesEnum.CREATE

    protected readonly canCreate: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.vehiclesPageTextSearchedParam()),
        this.facade.vehiclesPageDateTimeSearchedParam() !== undefined,
        this.facade.vehiclesPageStatusSearchedParam() !== undefined,
        this.facade.vehiclesPageVisibilitySearchedParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<VehiclesListSearchModel> = signal(toVehiclesListSearchModel({
        textSearched: this.facade.vehiclesPageTextSearchedParam(),
        dateTimeSearched: this.facade.vehiclesPageDateTimeSearchedParam(),
        statusSearched: this.facade.vehiclesPageStatusSearchedParam(),
        visibilitySearched: this.facade.vehiclesPageVisibilitySearchedParam(),
    }))
    protected readonly form: FieldTree<VehiclesListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchVehiclesPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toVehiclesListSearchParams> = toVehiclesListSearchParams(this.model())
        this.facade.inputPageSearchParameters(search.textSearched, search.dateTimeSearched, search.statusSearched, search.visibilitySearched)
        this.facade.fetchVehiclesPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ textSearched: '', dateTimeSearched: null, statusSearched: '', visibilitySearched: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchVehiclesPage(pageEvent.pageNumber, pageEvent.pageSize)
    }
}
