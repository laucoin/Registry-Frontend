import { NgTemplateOutlet } from '@angular/common'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink, RouterOutlet } from '@angular/router'
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
import { VEHICLES_LIST_SORT_FIELDS,
    VehiclesListSearchModel,
    toVehiclesListSearchModel,
    toVehiclesListSearchParams,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { sortQueryCodec } from '@shared/helpers/search/sort-query'
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component'
import { injectSearchQuery, SearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

const VEHICLES_LIST_DEFAULTS: VehiclesListSearchModel = toVehiclesListSearchModel({ q: undefined, at: undefined, status: undefined, isVisible: undefined, sort: undefined })
const VEHICLES_LIST_QUERY_SCHEMA: SearchQuerySchema<VehiclesListSearchModel> = { q: 'text', at: 'date', status: 'text', isVisible: 'choice' }

/**
 * Purpose: Page listant les véhicules du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des groupes, possède le formulaire de recherche et donne à la liste le template de ligne d'un véhicule.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-vehicles-list',
    imports: [
        SortFieldsComponent,
        IfProjectAuthorityDirective,
        ListComponent,
        VehicleRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        RouterOutlet,
        BooleanChoicePipe,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './vehicles-list.page.html',
})
export class VehiclesListPage {
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_RESTORE

    protected readonly facade: VehicleFacade = inject(VehicleFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly createRoute: VehicleRoutesEnum = VehicleRoutesEnum.CREATE

    protected readonly canCreate: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.vehiclesPageQueryParam()),
        this.facade.vehiclesPageAtParam() !== undefined,
        this.facade.vehiclesPageStatusParam() !== undefined,
        this.facade.vehiclesPageIsVisibleParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly sortFields: readonly string[] = VEHICLES_LIST_SORT_FIELDS
    protected readonly model: WritableSignal<VehiclesListSearchModel> = signal(VEHICLES_LIST_DEFAULTS)
    protected readonly form: FieldTree<VehiclesListSearchModel> = createSearchForm(this.model)
    protected readonly searchQuery: SearchQuery<VehiclesListSearchModel> = injectSearchQuery({
        schema: VEHICLES_LIST_QUERY_SCHEMA,
        defaults: VEHICLES_LIST_DEFAULTS,
        model: this.model,
        extra: sortQueryCodec<VehiclesListSearchModel>( VEHICLES_LIST_SORT_FIELDS ),
        search: (model: VehiclesListSearchModel): void => this.search(model),
        apply: (model: VehiclesListSearchModel): void => {
            this.inputSearch(model)
            this.facade.fetchVehiclesPage(undefined, undefined)
        },
    })

    protected search(model: VehiclesListSearchModel = this.model()): void {
        this.inputSearch(model)
        this.facade.fetchVehiclesPage(0, undefined)
        this.searchQuery.write(model)
    }

    protected resetFilters(): void {
        this.model.set(VEHICLES_LIST_DEFAULTS)
        this.search()
    }

    private inputSearch(model: VehiclesListSearchModel): void {
        const search: ReturnType<typeof toVehiclesListSearchParams> = toVehiclesListSearchParams(model)
        this.facade.inputPageSearchParameters(search.q, search.at, search.status, search.isVisible, search.sort)
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchVehiclesPage(pageEvent.page, pageEvent.size)
    }
}
