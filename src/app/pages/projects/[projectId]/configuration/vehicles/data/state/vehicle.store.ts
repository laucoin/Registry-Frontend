import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { GenericProjectElementStore } from '@shared/helpers/state/generic-project-element.store'
import { initialize } from '@shared/helpers/rx.helper'
import { VehicleStoreModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-store.model'
import {
    FetchVehicleMovementsContents,
    FetchVehicleMovementsPage,
    FetchVehiclePresencesStatus,
    FetchVehiclesPage,
    ResetVehicleState,
    StartVehicleMovementsPageLoader,
    StartVehiclesPageLoader,
    StopVehicleMovementsPageLoader,
    StopVehiclesPageLoader,
    UpdateVehicleMovementsPageSearchParams,
    UpdateVehiclesPageSearchParams,
} from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.action'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { inject, Injectable } from '@angular/core'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

const defaultVehicleStore: VehicleStoreModel = {
    vehicles: {
        element: undefined,
        params: {
            resetSearch: false,
            visibilitySearched: undefined,
            textSearched: undefined,
            statusSearched: undefined,
            dateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    movements: {
        element: undefined,
        params: {
            resetSearch: false,
            currentMovements: false,
            visibilitySearched: undefined,
            linkedToActivity: undefined,
            typeSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    _metadata: {
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

@State<VehicleStoreModel>( {
    name: 'vehicle',
    defaults: defaultVehicleStore,
} )
@Injectable()
export class VehicleStore extends GenericProjectElementStore<VehicleStoreModel> implements NgxsOnInit {
    private readonly api: VehicleApi = inject( VehicleApi )
    private readonly metadataApi: MetadataApi = inject( MetadataApi )
    private readonly movementApi: MovementApi = inject( MovementApi )
    private readonly facade: VehicleFacade = inject( VehicleFacade )

    public ngxsOnInit (): void {
        this.facade.fetchPresencesStatus()
    }

    @Selector()
    public static vehiclesPage (state: VehicleStoreModel): PageModel<VehicleModel> | undefined {
        return state.vehicles.element
    }

    @Selector()
    public static vehiclesPageLoading (state: VehicleStoreModel): boolean {
        return state.vehicles.loading
    }

    @Selector()
    public static vehiclesPageError (state: VehicleStoreModel): ToastMessageOptions | undefined {
        return state.vehicles.error
    }

    @Selector()
    public static vehiclesPageSilentLoading (state: VehicleStoreModel): boolean {
        return state.vehicles.silentLoading
    }

    @Selector()
    public static vehiclesPageResetSearch (state: VehicleStoreModel): boolean {
        return state.vehicles.params.resetSearch
    }

    @Selector()
    public static vehiclesPageTextSearchedParam (state: VehicleStoreModel): string | undefined {
        return state.vehicles.params.textSearched
    }

    @Selector()
    public static vehiclesPageDateTimeSearchedParam (state: VehicleStoreModel): string | undefined {
        return state.vehicles.params.dateTimeSearched
    }

    @Selector()
    public static vehiclesPageAvailabilitySearchedParam (state: VehicleStoreModel): boolean | undefined {
        return state.vehicles.params.statusSearched
    }

    @Selector()
    public static vehiclesPageVisibilitySearchedParam (state: VehicleStoreModel): boolean | undefined {
        return state.vehicles.params.visibilitySearched
    }

    @Selector()
    public static vehicleMovementsPage (state: VehicleStoreModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static vehicleMovementsPageLoading (state: VehicleStoreModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static vehicleMovementsPageError (state: VehicleStoreModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static vehicleMovementsPageSilentLoading (state: VehicleStoreModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static vehicleMovementsPageResetSearch (state: VehicleStoreModel): boolean {
        return state.movements.params.resetSearch
    }

    @Selector()
    public static vehicleMovementsPageTypeSearchedParam (state: VehicleStoreModel): string | undefined {
        return state.movements.params.typeSearched
    }

    @Selector()
    public static vehicleMovementsPageStartDateTimeSearchedParam (state: VehicleStoreModel): string | undefined {
        return state.movements.params.startDateTimeSearched
    }

    @Selector()
    public static vehicleMovementsPageEndDateTimeSearchedParam (state: VehicleStoreModel): string | undefined {
        return state.movements.params.endDateTimeSearched
    }

    @Selector()
    public static vehicleMovementsPageVisibilitySearchedParam (state: VehicleStoreModel): boolean | undefined {
        return state.movements.params.visibilitySearched
    }

    @Selector()
    public static availabilitiesMetadata (state: VehicleStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Selector()
    public static visibilitiesMetadata (state: VehicleStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Selector()
    public static presencesStatusMetadata (state: VehicleStoreModel): SelectItem<PresenceStatusEnum | undefined>[] {
        return state._metadata.presencesStatus
    }

    @Action( ResetVehicleState )
    public resetVehicleState (ctx: StateContext<VehicleStoreModel>): void {
        ctx.setState( {
            ...defaultVehicleStore,
            _metadata: {
                ...defaultVehicleStore._metadata,
                presencesStatus: ctx.getState()._metadata.presencesStatus,
            },
        } )
    }

    @Action( FetchVehiclePresencesStatus )
    public fetchVehiclePresencesStatus (ctx: StateContext<VehicleStoreModel>): Observable<void> {
        return this.metadataApi.getPresencesStatus().pipe(
            map( (types: SelectItem<PresenceStatusEnum>[]): void => this.fetchVehiclePresencesStatusComplete(
                ctx,
                types,
            ) ),
        )
    }

    private fetchVehiclePresencesStatusComplete (
        ctx: StateContext<VehicleStoreModel>,
        status: SelectItem<PresenceStatusEnum>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                presencesStatus: [
                    { label: '-', value: undefined },
                    ...status,
                ],
            },
        } )
    }

    @Action( StartVehiclesPageLoader )
    public startVehiclesPageLoader (ctx: StateContext<VehicleStoreModel>): void {
        ctx.patchState( {
            vehicles: StateHelper.updatePageLoader( ctx.getState().vehicles, true ),
        } )
    }

    @Action( StopVehiclesPageLoader )
    public stopVehiclesPageLoader (ctx: StateContext<VehicleStoreModel>): void {
        ctx.patchState( {
            vehicles: StateHelper.updatePageLoader( ctx.getState().vehicles, false ),
        } )
    }

    @Action( FetchVehiclesPage )
    public fetchVehiclesPage (
        ctx: StateContext<VehicleStoreModel>,
        payload: FetchVehiclesPage,
    ): Observable<void> {
        return this.api.findVehicles(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().vehicles.params,
        ).pipe(
            initialize( (): void => this.facade.startVehiclesPageLoader() ),
            finalize( (): void => this.facade.stopVehiclesPageLoader() ),
            map( (vehiclePage: PageModel<VehicleModel>): void => this.fetchVehiclesPageComplete(
                ctx,
                vehiclePage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchVehiclesPageComplete (
        ctx: StateContext<VehicleStoreModel>,
        vehiclePage: PageModel<VehicleModel>,
    ): void {
        ctx.patchState( {
            vehicles: {
                ...ctx.getState().vehicles,
                params: {
                    ...ctx.getState().vehicles.params,
                    resetSearch: false,
                },
                element: vehiclePage,
            },
        } )
    }

    @Action( UpdateVehiclesPageSearchParams )
    public updateVehiclesPageSearchParams (
        ctx: StateContext<VehicleStoreModel>,
        payload: UpdateVehiclesPageSearchParams,
    ): void {
        ctx.patchState( {
            vehicles: {
                ...ctx.getState().vehicles,
                params: payload.params,
            },
        } )
    }

    @Action( StartVehicleMovementsPageLoader )
    public startVehicleMovementsPageLoader (ctx: StateContext<VehicleStoreModel>): void {
        ctx.patchState( {
            movements: StateHelper.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopVehicleMovementsPageLoader )
    public stopVehicleMovementsPageLoader (ctx: StateContext<VehicleStoreModel>): void {
        ctx.patchState( {
            movements: StateHelper.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchVehicleMovementsPage )
    public fetchVehicleMovementsPage (
        ctx: StateContext<VehicleStoreModel>,
        payload: FetchVehicleMovementsPage,
    ): Observable<void> {
        return this.api.findVehicleMovements(
            payload.projectId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startVehicleMovementsPageLoader() ),
            finalize( (): void => this.facade.stopVehicleMovementsPageLoader() ),
            map( (movementsPage: PageModel<MovementModel>): void => this.fetchVehicleMovementsPageComplete(
                ctx,
                movementsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.movementsPageError( ctx, error ) ),
        )
    }

    private fetchVehicleMovementsPageComplete (
        ctx: StateContext<VehicleStoreModel>,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    resetSearch: false,
                },
                element: movementsPage,
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchVehicleMovementsContent(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
            )
        }
    }

    @Action( FetchVehicleMovementsContents )
    public fetchVehicleMovementsContents (
        ctx: StateContext<VehicleStoreModel>,
        payload: FetchVehicleMovementsContents,
    ): Observable<void> {
        return this.movementApi.findMovementsContents(
            payload.projectId,
            payload.movementIds,
            ctx.getState().movements.params.currentMovements,
        ).pipe(
            map( (contents: PairModel<MovementContentModel[]>[]): void => this.fetchVehicleMovementsContentsComplete(
                ctx,
                contents,
            ) ),
        )
    }

    private fetchVehicleMovementsContentsComplete (
        ctx: StateContext<VehicleStoreModel>,
        contents: PairModel<MovementContentModel[]>[],
    ): void {
        if (!ctx.getState().movements.element) {
            return
        }

        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                element: {
                    ...ctx.getState().movements.element!,
                    content: MovementHelper.rebuildPageWithContent( ctx.getState().movements.element!.content, contents ),
                },
            },
        } )
    }

    @Action( UpdateVehicleMovementsPageSearchParams )
    public updateVehicleMovementsPageSearchParams (
        ctx: StateContext<VehicleStoreModel>,
        payload: UpdateVehicleMovementsPageSearchParams,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: payload.params,
            },
        } )
    }

    protected refreshPage (ctx: StateContext<VehicleStoreModel>): void {
        const page: PageModel<VehicleModel> | undefined = ctx.getState().vehicles.element
        this.facade.fetchVehiclesPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<VehicleStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                vehicles: this.buildErrorMessage( ctx.getState().vehicles, error ),
            } )
        }

        return of()
    }

    protected movementsPageError (ctx: StateContext<VehicleStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                movements: this.buildErrorMessage( ctx.getState().movements, error ),
            } )
        }
        return of()
    }
}
