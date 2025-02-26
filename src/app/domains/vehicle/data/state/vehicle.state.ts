import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import { VehicleStateModel } from '../model/vehicle-state.model'
import {
    CreateVehicle,
    DeleteVehicle,
    DisableVehicle,
    EnableVehicle,
    FetchVehicle,
    FetchVehicleMovementsPage,
    FetchVehicleMovementTypes,
    FetchVehiclesPage,
    InputVehicleMovementsPageDateRange,
    InputVehicleMovementsPageSearch,
    InputVehiclesPageDateRange,
    InputVehiclesPageSearch,
    ResetVehicle,
    SelectVehicleMovementsPageOrder,
    SelectVehicleMovementsPageVisibility,
    SelectVehiclesPageOrder,
    SelectVehiclesPageVisibility,
    StartVehicleLoader,
    StartVehicleMovementsPageLoader,
    StartVehiclesPageLoader,
    StopVehicleLoader,
    StopVehicleMovementsPageLoader,
    StopVehiclesPageLoader,
    UpdateVehicle,
} from './vehicle.action'
import { VehicleService } from './vehicle.service'
import { VehicleFacade } from './vehicle.facade'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { Injectable } from '@angular/core'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { MovementModel } from '../../../../shared/util-model/movement.model'
import { MovementService } from '../../../movement/data/state/movement.service'

const defaultVehicle: ElementRequestInformationModel<VehicleModel> = {
    element: undefined,
    loading: false,
}

const defaultVehicleState: VehicleStateModel = {
    vehicles: {
        element: undefined,
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            searched: undefined,
            isPresent: false,
            startDate: undefined,
            endDate: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    movements: {
        element: undefined,
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            searched: undefined,
            type: undefined,
            startDate: undefined,
            endDate: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    vehicle: defaultVehicle,
    _metadata: {
        movementTypes: [],
    },
}

@State<VehicleStateModel>( {
    name: 'vehicle',
    defaults: defaultVehicleState,
} )
@Injectable()
export class VehicleState extends GenericEventElementState<VehicleStateModel> {
    private readonly vehicleIcon: string = 'pi pi-users'

    public constructor (
        private readonly service: VehicleService,
        private readonly movementService: MovementService,
        private readonly facade: VehicleFacade,
    ) {
        super()
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
    public static vehiclesPageSearchParam (state: VehicleStateModel): string | undefined {
        return state.vehicles.params.searched
    }

    @Selector()
    public static vehiclesPageStartDateParam (state: VehicleStateModel): string | undefined {
        return state.vehicles.params.startDate
    }

    @Selector()
    public static vehiclesPageEndDateParam (state: VehicleStateModel): string | undefined {
        return state.vehicles.params.endDate
    }

    @Selector()
    public static vehiclesPageOnlyVisibleParam (state: VehicleStateModel): boolean {
        return state.vehicles.params.onlyVisible
    }

    @Selector()
    public static vehiclesPageOrderParam (state: VehicleStateModel): OrderEnum {
        return state.vehicles.params.order
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
    public static vehicleMovementsPageSearchParam (state: VehicleStateModel): string | undefined {
        return state.movements.params.searched
    }

    @Selector()
    public static vehicleMovementsPageMovementTypeParam (state: VehicleStateModel): string | undefined {
        return state.movements.params.searched
    }

    @Selector()
    public static vehicleMovementsPageStartDateParam (state: VehicleStateModel): string | undefined {
        return state.movements.params.startDate
    }

    @Selector()
    public static vehicleMovementsPageEndDateParam (state: VehicleStateModel): string | undefined {
        return state.movements.params.endDate
    }

    @Selector()
    public static vehicleMovementsPageOnlyVisibleParam (state: VehicleStateModel): boolean {
        return state.movements.params.onlyVisible
    }

    @Selector()
    public static vehicleMovementsPageOrderParam (state: VehicleStateModel): OrderEnum {
        return state.movements.params.order
    }

    @Selector()
    public static vehicle (state: VehicleStateModel): VehicleModel | undefined {
        return state.vehicle.element
    }

    @Selector()
    public static vehicleLoading (state: VehicleStateModel): boolean {
        return state.vehicle.loading
    }

    @Selector()
    public static movementTypesMetadata (state: VehicleStateModel): SelectItem<string>[] {
        return state._metadata.movementTypes
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
            payload.eventId,
            payload.offset,
            payload.limit,
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
                element: vehiclePage,
            },
        } )
    }

    @Action( InputVehiclesPageSearch )
    public inputVehiclesPageSearch (
        ctx: StateContext<VehicleStateModel>,
        payload: InputVehiclesPageSearch,
    ): void {
        ctx.patchState( {
            vehicles: {
                ...ctx.getState().vehicles,
                params: {
                    ...ctx.getState().vehicles.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputVehiclesPageDateRange )
    public inputVehiclesPageDateRange (
        ctx: StateContext<VehicleStateModel>,
        payload: InputVehiclesPageDateRange,
    ): void {
        ctx.patchState( {
            vehicles: {
                ...ctx.getState().vehicles,
                params: {
                    ...ctx.getState().vehicles.params,
                    startDate: payload.start?.toISOString(),
                    endDate: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectVehiclesPageVisibility )
    public selectVehiclesPageVisibility (
        ctx: StateContext<VehicleStateModel>,
        payload: SelectVehiclesPageVisibility,
    ): void {
        ctx.patchState( {
            vehicles: {
                ...ctx.getState().vehicles,
                params: {
                    ...ctx.getState().vehicles.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectVehiclesPageOrder )
    public selectVehiclesPageOrder (
        ctx: StateContext<VehicleStateModel>,
        payload: SelectVehiclesPageOrder,
    ): void {
        ctx.patchState( {
            vehicles: {
                ...ctx.getState().vehicles,
                params: {
                    ...ctx.getState().vehicles.params,
                    order: payload.order,
                },
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

    @Action( FetchVehicleMovementTypes )
    public fetchVehicleMovementTypes (
        ctx: StateContext<VehicleStateModel>,
        payload: FetchVehicleMovementTypes,
    ): Observable<void> {
        return this.movementService.getAvailableMovementTypes( payload.eventId ).pipe(
            map( (types: SelectItem<string>[]): void => this.fetchVehicleMovementTypesComplete( ctx, types ) ),
        )
    }

    private fetchVehicleMovementTypesComplete (
        ctx: StateContext<VehicleStateModel>,
        movementTypes: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                movementTypes: movementTypes,
            },
        } )
    }

    @Action( FetchVehicleMovementsPage )
    public fetchVehicleMovementsPage (
        ctx: StateContext<VehicleStateModel>,
        payload: FetchVehicleMovementsPage,
    ): Observable<void> {
        return this.service.findVehicleMovements(
            payload.eventId,
            payload.id,
            payload.offset,
            payload.limit,
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
                element: movementsPage,
            },
        } )
    }

    @Action( InputVehicleMovementsPageSearch )
    public inputVehicleMovementsPageSearch (
        ctx: StateContext<VehicleStateModel>,
        payload: InputVehiclesPageSearch,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputVehicleMovementsPageDateRange )
    public inputVehicleMovementsPageDateRange (
        ctx: StateContext<VehicleStateModel>,
        payload: InputVehiclesPageDateRange,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    startDate: payload.start?.toISOString(),
                    endDate: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectVehicleMovementsPageVisibility )
    public selectVehicleMovementsPageVisibility (
        ctx: StateContext<VehicleStateModel>,
        payload: SelectVehiclesPageVisibility,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectVehicleMovementsPageOrder )
    public selectVehicleMovementsPageOrder (
        ctx: StateContext<VehicleStateModel>,
        payload: SelectVehiclesPageOrder,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    order: payload.order,
                },
            },
        } )
    }

    @Action( StartVehicleLoader )
    public startVehicleLoader (ctx: StateContext<VehicleStateModel>): void {
        ctx.patchState( {
            vehicle: StateUtil.updateElementLoader( ctx.getState().vehicle, true ),
        } )
    }

    @Action( StopVehicleLoader )
    public stopVehicleLoader (ctx: StateContext<VehicleStateModel>): void {
        ctx.patchState( {
            vehicle: StateUtil.updateElementLoader( ctx.getState().vehicle, false ),
        } )
    }

    @Action( FetchVehicle )
    public fetchVehicle (ctx: StateContext<VehicleStateModel>, payload: FetchVehicle): Observable<void> {
        return this.service.findVehicleById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.fetchVehicleComplete( ctx, vehicle ) ),
        )
    }

    private fetchVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        vehicle: VehicleModel,
    ): void {
        ctx.patchState( {
            vehicle: {
                ...ctx.getState().vehicle,
                element: vehicle,
            },
        } )
    }

    @Action( ResetVehicle )
    public resetVehicle (ctx: StateContext<VehicleStateModel>): void {
        ctx.patchState( {
            vehicle: defaultVehicle,
        } )
    }

    @Action( CreateVehicle )
    public createVehicle (ctx: StateContext<VehicleStateModel>, payload: CreateVehicle): Observable<void> {
        return this.service.createVehicle( payload.eventId, payload.vehicle ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.createVehicleComplete(
                ctx,
                payload.eventId,
                vehicle,
            ) ),
        )
    }

    private createVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        eventId: string | undefined,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.vehicle.create',
            'success.message.vehicle.create',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( UpdateVehicle )
    public updateVehicle (ctx: StateContext<VehicleStateModel>, payload: UpdateVehicle): Observable<void> {
        return this.service.updateVehicleById( payload.eventId, payload.id, payload.vehicle ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.updateVehicleComplete(
                ctx,
                payload.eventId,
                vehicle,
            ) ),
        )
    }

    private updateVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        eventId: string | undefined,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.vehicle.edit',
            'success.message.vehicle.edit',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DisableVehicle )
    public disableVehicle (
        ctx: StateContext<VehicleStateModel>,
        payload: DisableVehicle,
    ): Observable<void> {
        return this.service.disableVehicleById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.disableVehicleComplete(
                ctx,
                payload.eventId,
                vehicle,
            ) ),
        )
    }

    private disableVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        eventId: string | undefined,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.vehicle.disable',
            'success.message.vehicle.disable',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( EnableVehicle )
    public enableVehicle (ctx: StateContext<VehicleStateModel>, payload: EnableVehicle): Observable<void> {
        return this.service.enableVehicleById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.enableVehicleComplete(
                ctx,
                payload.eventId,
                vehicle,
            ) ),
        )
    }

    private enableVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        eventId: string | undefined,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.vehicle.enable',
            'success.message.vehicle.enable',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DeleteVehicle )
    public deleteVehicle (ctx: StateContext<VehicleStateModel>, payload: DeleteVehicle): Observable<void> {
        return this.service.deleteVehicleById( undefined, payload.vehicle.id ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (): void => this.deleteVehicleComplete(
                ctx,
                payload.eventId,
                payload.vehicle,
            ) ),
        )
    }

    private deleteVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        eventId: string | undefined,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.vehicle.delete',
            'success.message.vehicle.delete',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx, eventId )
    }

    private buildTranslationArgs (vehicle: VehicleModel): object {
        return {
            registration: vehicle?.registration,
            brand: vehicle?.brand,
            model: vehicle?.model,
        }
    }

    protected refreshPage (ctx: StateContext<VehicleStateModel>, eventId: string | undefined): void {
        const page: PageModel<VehicleModel> | undefined = ctx.getState().vehicles.element
        this.facade.fetchVehiclesPage( page?.offset, page?.limit, true, eventId )
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
