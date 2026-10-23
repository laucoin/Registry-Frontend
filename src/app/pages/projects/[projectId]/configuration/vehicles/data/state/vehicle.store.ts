import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {TranslocoService} from '@jsverse/transloco'
import { catchError, EMPTY, finalize, map, Observable, pipe, skip, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehiclePageParamsModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-page-params.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { VehicleStoreModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-store.model'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, notifyOnError, reportError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

interface VehiclesPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface VehicleMovementsPageRequest extends VehiclesPageRequest {
    id: string
}

interface VehicleMovementsContentsRequest {
    projectId: string | undefined
    movementIds: string[]
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

export const VehicleStore = signalStore(
    withState<VehicleStoreModel>( defaultVehicleStore ),
    withProfileScope<VehicleStoreModel>( defaultVehicleStore, (current: VehicleStoreModel): Partial<VehicleStoreModel> => ({
        metadata: { ...defaultVehicleStore.metadata, presencesStatus: current.metadata.presencesStatus },
    }) ),
    withProps( () => ({
        api: inject( VehicleApi ),
        movementApi: inject( MovementApi ),
        metadataApi: inject( MetadataApi ),
        registryFacade: inject( RegistryFacade ),
    }) ),
    withMethods( (store) => {
        const fetchPresencesStatus = rxMethod<void>( pipe(
            switchMap( (): Observable<SelectItem<PresenceStatusEnum>[]> => store.metadataApi.getPresencesStatus().pipe(
                notifyOnError( store.registryFacade ),
            ) ),
            tap( (status: SelectItem<PresenceStatusEnum>[]): void => patchState( store, (state: VehicleStoreModel) => ({
                metadata: { ...state.metadata, presencesStatus: [ { label: '-', value: undefined }, ...status ] },
            }) ) ),
        ) )

        const fetchMovementsContents = rxMethod<VehicleMovementsContentsRequest>( pipe(
            switchMap( (request: VehicleMovementsContentsRequest): Observable<PairModel<MovementContentModel[]>[]> =>
                store.movementApi.findMovementsContents(
                    request.projectId,
                    request.movementIds,
                    store.movements.params.currentMovements(),
                ).pipe( notifyOnError( store.registryFacade ) ),
            ),
            tap( (contents: PairModel<MovementContentModel[]>[]): void => patchState( store, (state: VehicleStoreModel) => {
                if (!state.movements.element) return state
                return {
                    movements: {
                        ...state.movements,
                        element: {
                            ...state.movements.element,
                            content: MovementHelper.rebuildPageWithContent( state.movements.element.content, contents ),
                        },
                    },
                }
            }) ),
        ) )

        return {
            fetchPresencesStatus,

            fetchVehiclesPage: rxMethod<VehiclesPageRequest>( pipe(
                switchMap( (request: VehiclesPageRequest): Observable<PageModel<VehicleModel>> => store.api.findVehicles(
                    request.projectId,
                    request.pageNumber,
                    request.pageSize,
                    store.vehicles.params(),
                ).pipe(
                    initialize( (): void => patchState( store, (state: VehicleStoreModel) => ({
                        vehicles: StateHelper.updatePageLoader( state.vehicles, true ),
                    }) ) ),
                    finalize( (): void => patchState( store, (state: VehicleStoreModel) => ({
                        vehicles: StateHelper.updatePageLoader( state.vehicles, false ),
                    }) ) ),
                    catchError( (error: ErrorModel): Observable<never> => {
                        if (error.status === 503) {
                            reportError( store.registryFacade, error )
                        } else {
                            patchState( store, (state: VehicleStoreModel) => ({
                                vehicles: PageStateHelper.withError( state.vehicles, error ),
                            }) )
                        }
                        return EMPTY
                    } ),
                ) ),
                tap( (page: PageModel<VehicleModel>): void => patchState( store, (state: VehicleStoreModel) => ({
                    vehicles: {
                        ...state.vehicles,
                        params: { ...state.vehicles.params, resetSearch: false },
                        element: page,
                    },
                }) ) ),
            ) ),

            updateVehiclesPageSearchParams: (params: VehiclePageParamsModel): void => {
                patchState( store, (state: VehicleStoreModel) => ({ vehicles: { ...state.vehicles, params: params } }) )
            },

            fetchVehicleMovementsPage: rxMethod<VehicleMovementsPageRequest>( pipe(
                switchMap( (request: VehicleMovementsPageRequest): Observable<{
                    request: VehicleMovementsPageRequest
                    page: PageModel<MovementModel>
                }> => store.api.findVehicleMovements(
                    request.projectId,
                    request.id,
                    request.pageNumber,
                    request.pageSize,
                    store.movements.params(),
                ).pipe(
                    initialize( (): void => patchState( store, (state: VehicleStoreModel) => ({
                        movements: StateHelper.updatePageLoader( state.movements, true ),
                    }) ) ),
                    finalize( (): void => patchState( store, (state: VehicleStoreModel) => ({
                        movements: StateHelper.updatePageLoader( state.movements, false ),
                    }) ) ),
                    catchError( (error: ErrorModel): Observable<never> => {
                        if (error.status === 503) {
                            reportError( store.registryFacade, error )
                        } else {
                            patchState( store, (state: VehicleStoreModel) => ({
                                movements: PageStateHelper.withError( state.movements, error ),
                            }) )
                        }
                        return EMPTY
                    } ),
                    map( (page: PageModel<MovementModel>) => ({ request, page }) ),
                ) ),
                tap( ({ request, page }): void => {
                    patchState( store, (state: VehicleStoreModel) => ({
                        movements: {
                            ...state.movements,
                            params: { ...state.movements.params, resetSearch: false },
                            element: page,
                        },
                    }) )
                    if (page.content.length > 0) {
                        fetchMovementsContents( {
                            projectId: request.projectId,
                            movementIds: page.content.map( (movement: MovementModel): string => movement.id ),
                        } )
                    }
                } ),
            ) ),

            fetchVehicleMovementsContents: fetchMovementsContents,

            updateVehicleMovementsPageSearchParams: (params: MovementPageParamsModel): void => {
                patchState( store, (state: VehicleStoreModel) => ({ movements: { ...state.movements, params: params } }) )
            },
        }
    } ),
    withHooks( {
        onInit (store): void {
            store.fetchPresencesStatus()
            inject( TranslocoService ).langChanges$.pipe( skip( 1 ), takeUntilDestroyed() ).subscribe( (): void => {
                store.fetchPresencesStatus()
            } )
        },
    } ),
)
