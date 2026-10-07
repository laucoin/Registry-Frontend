import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { GenericProjectElementState } from '@shared/helpers/state/generic-project-element.state'
import { initialize } from '@shared/helpers/util/rx.util'
import { VehicleStateModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-state.model'
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
import { VehicleService } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.service'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { StateUtil } from '@shared/helpers/state/state.util'
import { inject, Injectable } from '@angular/core'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementService } from '@pages/projects/[projectId]/movements/data/state/movement.service'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementUtil } from '@shared/helpers/util/movement.util'
import { MetadataService } from '@core/registry/state/metadata.service'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

const defaultVehicleState: VehicleStateModel = {
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

@State<VehicleStateModel>( {
    name: 'vehicle',
    defaults: defaultVehicleState,
} )
@Injectable()
export class VehicleState extends GenericProjectElementState<VehicleStateModel> implements NgxsOnInit {
    private readonly service: VehicleService = inject( VehicleService )
    private readonly metadataService: MetadataService = inject( MetadataService )
    private readonly movementService: MovementService = inject( MovementService )
    private readonly facade: VehicleFacade = inject( VehicleFacade )

    public ngxsOnInit (): void {
        this.facade.fetchPresencesStatus()
    }

    @Selector()
    public static vehiclesPage (state: VehicleStateModel): PageModel<VehicleModel> | undefined {
        return state.vehicles.element
    }

    @Selector()
    public static vehiclesPageLoading (state: VehicleStateModel): boolean {
        return state.vehicles.loading
    }

    @Selector()
    public static vehiclesPageError (state: VehicleStateModel): ToastMessageOptions | undefined {
        return state.vehicles.error
    }

    @Selector()
    public static vehiclesPageSilentLoading (state: VehicleStateModel): boolean {
        return state.vehicles.silentLoading
    }

    @Selector()
    public static vehiclesPageResetSearch (state: VehicleStateModel): boolean {
        return state.vehicles.params.resetSearch
    }

    @Selector()
    public static vehiclesPageTextSearchedParam (state: VehicleStateModel): string | undefined {
        return state.vehicles.params.textSearched
    }

    @Selector()
    public static vehiclesPageDateTimeSearchedParam (state: VehicleStateModel): string | undefined {
        return state.vehicles.params.dateTimeSearched
    }

    @Selector()
    public static vehiclesPageAvailabilitySearchedParam (state: VehicleStateModel): boolean | undefined {
        return state.vehicles.params.statusSearched
    }

    @Selector()
    public static vehiclesPageVisibilitySearchedParam (state: VehicleStateModel): boolean | undefined {
        return state.vehicles.params.visibilitySearched
    }

    @Selector()
    public static vehicleMovementsPage (state: VehicleStateModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static vehicleMovementsPageLoading (state: VehicleStateModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static vehicleMovementsPageError (state: VehicleStateModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static vehicleMovementsPageSilentLoading (state: VehicleStateModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static vehicleMovementsPageResetSearch (state: VehicleStateModel): boolean {
        return state.movements.params.resetSearch
    }

    @Selector()
    public static vehicleMovementsPageTypeSearchedParam (state: VehicleStateModel): string | undefined {
        return state.movements.params.typeSearched
    }

    @Selector()
    public static vehicleMovementsPageStartDateTimeSearchedParam (state: VehicleStateModel): string | undefined {
        return state.movements.params.startDateTimeSearched
    }

    @Selector()
    public static vehicleMovementsPageEndDateTimeSearchedParam (state: VehicleStateModel): string | undefined {
        return state.movements.params.endDateTimeSearched
    }

    @Selector()
    public static vehicleMovementsPageVisibilitySearchedParam (state: VehicleStateModel): boolean | undefined {
        return state.movements.params.visibilitySearched
    }

    @Selector()
    public static availabilitiesMetadata (state: VehicleStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Selector()
    public static visibilitiesMetadata (state: VehicleStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Selector()
    public static presencesStatusMetadata (state: VehicleStateModel): SelectItem<PresenceStatusEnum | undefined>[] {
        return state._metadata.presencesStatus
    }

    @Action( ResetVehicleState )
    public resetVehicleState (ctx: StateContext<VehicleStateModel>): void {
        ctx.setState( {
            ...defaultVehicleState,
            _metadata: {
                ...defaultVehicleState._metadata,
                presencesStatus: ctx.getState()._metadata.presencesStatus,
            },
        } )
    }

    @Action( FetchVehiclePresencesStatus )
    public fetchVehiclePresencesStatus (ctx: StateContext<VehicleStateModel>): Observable<void> {
        return this.metadataService.getPresencesStatus().pipe(
            map( (types: SelectItem<PresenceStatusEnum>[]): void => this.fetchVehiclePresencesStatusComplete(
                ctx,
                types,
            ) ),
        )
    }

    private fetchVehiclePresencesStatusComplete (
        ctx: StateContext<VehicleStateModel>,
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
    public startVehiclesPageLoader (ctx: StateContext<VehicleStateModel>): void {
        ctx.patchState( {
            vehicles: StateUtil.updatePageLoader( ctx.getState().vehicles, true ),
        } )
    }

    @Action( StopVehiclesPageLoader )
    public stopVehiclesPageLoader (ctx: StateContext<VehicleStateModel>): void {
        ctx.patchState( {
            vehicles: StateUtil.updatePageLoader( ctx.getState().vehicles, false ),
        } )
    }

    @Action( FetchVehiclesPage )
    public fetchVehiclesPage (
        ctx: StateContext<VehicleStateModel>,
        payload: FetchVehiclesPage,
    ): Observable<void> {
        return this.service.findVehicles(
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
        ctx: StateContext<VehicleStateModel>,
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
        ctx: StateContext<VehicleStateModel>,
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
    public startVehicleMovementsPageLoader (ctx: StateContext<VehicleStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopVehicleMovementsPageLoader )
    public stopVehicleMovementsPageLoader (ctx: StateContext<VehicleStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchVehicleMovementsPage )
    public fetchVehicleMovementsPage (
        ctx: StateContext<VehicleStateModel>,
        payload: FetchVehicleMovementsPage,
    ): Observable<void> {
        return this.service.findVehicleMovements(
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
        ctx: StateContext<VehicleStateModel>,
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
        ctx: StateContext<VehicleStateModel>,
        payload: FetchVehicleMovementsContents,
    ): Observable<void> {
        return this.movementService.findMovementsContents(
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
        ctx: StateContext<VehicleStateModel>,
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
                    content: MovementUtil.rebuildPageWithContent( ctx.getState().movements.element!.content, contents ),
                },
            },
        } )
    }

    @Action( UpdateVehicleMovementsPageSearchParams )
    public updateVehicleMovementsPageSearchParams (
        ctx: StateContext<VehicleStateModel>,
        payload: UpdateVehicleMovementsPageSearchParams,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: payload.params,
            },
        } )
    }

    protected refreshPage (ctx: StateContext<VehicleStateModel>): void {
        const page: PageModel<VehicleModel> | undefined = ctx.getState().vehicles.element
        this.facade.fetchVehiclesPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<VehicleStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                vehicles: this.buildErrorMessage( ctx.getState().vehicles, error ),
            } )
        }

        return of()
    }

    protected movementsPageError (ctx: StateContext<VehicleStateModel>, error: ErrorModel): Observable<void> {
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
