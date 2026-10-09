import { inject } from '@angular/core'
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { VehiclePageParamsModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-page-params.model'
import { VehicleStoreModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-store.model'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { refreshOnLanguageChange } from '@shared/helpers/store/language-refresh'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import {
    contentsRequester,
    metadataFetcher,
    movementContentsFetcher,
    pageFetcher,
    paramsUpdater,
    withEmptyOption,
} from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

interface VehiclesPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface VehicleMovementsPageRequest extends VehiclesPageRequest {
    id: string
}

const defaultVehicleStore: VehicleStoreModel = {
    vehicles: PageStateHelper.initial<VehiclePageParamsModel, VehicleModel>( {
        resetSearch: false,
        visibilitySearched: undefined,
        textSearched: undefined,
        statusSearched: undefined,
        dateTimeSearched: undefined,
    } ),
    movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        currentMovements: false,
        visibilitySearched: undefined,
        linkedToActivity: undefined,
        typeSearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    metadata: {
        availabilities: [
            { label: '-', value: undefined },
            { label: 'vehicles.available.true', value: true },
            { label: 'vehicles.available.false', value: false },
        ],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'vehicles.visible.true', value: true },
            { label: 'vehicles.visible.false', value: false },
        ],
        presencesStatus: [],
    },
}

/**
 * Purpose: Holds the vehicle state.
 * Scope: Owns the data of the vehicle pages and resources with their loading and error flags, and fetches them through the vehicle api.
 * Limits: Reached through the vehicle facade; it does not format data or notify the user of command results.
 */
export const VehicleStore = signalStore(
    withState<VehicleStoreModel>( defaultVehicleStore ),
    withProfileScope<VehicleStoreModel>( defaultVehicleStore, (current: VehicleStoreModel): Partial<VehicleStoreModel> => ({
        metadata: { ...defaultVehicleStore.metadata, presencesStatus: current.metadata.presencesStatus },
    }) ),
    withMethods( (store, api = inject( VehicleApi ), movementApi = inject( MovementApi ), metadataApi = inject( MetadataApi ), errors = inject( ErrorReporter )) => ({
        fetchPresencesStatus: metadataFetcher<VehicleStoreModel, 'presencesStatus', void, SelectOptionModel<PresenceStatusEnum>[]>(
            store, 'presencesStatus', () => metadataApi.getPresencesStatus(), errors, withEmptyOption,
        ),
        fetchVehiclesPage: pageFetcher( store, 'vehicles', (request: VehiclesPageRequest, params: VehiclePageParamsModel) =>
            api.findVehicles( request.projectId, request.pageNumber, request.pageSize, params ), errors ),
        updateVehiclesPageSearchParams: paramsUpdater( store, 'vehicles' ),
        updateVehicleMovementsPageSearchParams: paramsUpdater( store, 'movements' ),
        fetchVehicleMovementsContents: movementContentsFetcher( store, movementApi, errors ),
    }) ),
    withMethods( (store, api = inject( VehicleApi ), errors = inject( ErrorReporter )) => ({
        fetchVehicleMovementsPage: pageFetcher( store, 'movements', (request: VehicleMovementsPageRequest, params: MovementPageParamsModel) =>
            api.findVehicleMovements( request.projectId, request.id, request.pageNumber, request.pageSize, params ), errors, {
            after: contentsRequester( store.fetchVehicleMovementsContents ),
        } ),
    }) ),
    withHooks( {
        onInit: (store): void => refreshOnLanguageChange( store.fetchPresencesStatus ),
    } ),
)
