import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { VehicleModel } from '../../../../../../shared/util-model/model/vehicle.model'
import { GenericProjectElementState } from '../../../../../../shared/util-tool/state/generic-project-element.state'
import { initialize } from '../../../../../../shared/util-tool/util/rx.util'
import { VehicleStateModel } from '../model/vehicle-state.model'
import {
    CreateVehicle,
    DeleteVehicle,
    DisableVehicle,
    EnableVehicle,
    FetchVehicle,
    FetchVehicleMovementsContents,
    FetchVehicleMovementsPage,
    FetchVehiclePresencesStatus,
    FetchVehiclesPage,
    ResetVehicle,
    StartVehicleLoader,
    StartVehicleMovementsPageLoader,
    StartVehiclesPageLoader,
    StopVehicleLoader,
    StopVehicleMovementsPageLoader,
    StopVehiclesPageLoader,
    UpdateVehicle,
    UpdateVehicleMovementsPageSearchParams,
    UpdateVehiclesPageSearchParams,
} from './vehicle.action'
import { VehicleService } from './vehicle.service'
import { VehicleFacade } from './vehicle.facade'
import { StateUtil } from '../../../../../../shared/util-tool/state/state.util'
import { Injectable } from '@angular/core'
import {
    ElementRequestInformationModel,
} from '../../../../../../shared/util-model/model/element-request-information.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../../../../../shared/util-model/model/error.model'
import { MovementModel } from '../../../../../../shared/util-model/model/movement.model'
import { MovementService } from '../../../../movement/data/state/movement.service'
import { PairModel } from '../../../../../../shared/util-model/model/pair.model'
import { MovementContentModel } from '../../../../../../shared/util-model/model/movement-content.model'
import { MovementUtil } from '../../../../../../shared/util-tool/util/movement.util'
import { MetadataService } from '../../../../../../shared/util-common/state/metadata.service'
import { PresenceStatusEnum } from '../../../../../../shared/util-model/enumeration/presence-status.enum'
import { SeverityEnum } from '../../../../../../shared/util-model/enumeration/severity.enum'

const defaultVehicle: ElementRequestInformationModel<VehicleModel> = {
    element: undefined,
    loading: false,
}

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
            visibilitySearched: undefined,
            typeSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    vehicle: defaultVehicle,
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
    private readonly vehicleIcon: string = 'pi pi-users'

    public constructor (
        private readonly service: VehicleService,
        private readonly metadataService: MetadataService,
        private readonly movementService: MovementService,
        private readonly facade: VehicleFacade,
    ) {
        super()
    }

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
    public static vehicle (state: VehicleStateModel): VehicleModel | undefined {
        return state.vehicle.element
    }

    @Selector()
    public static vehicleLoading (state: VehicleStateModel): boolean {
        return state.vehicle.loading
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
        return this.movementService.findMovementsContent(
            payload.projectId,
            payload.movementIds,
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
        return this.service.findVehicleById( payload.projectId, payload.id ).pipe(
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
        return this.service.createVehicle( payload.projectId, payload.vehicle ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.createVehicleComplete(
                ctx,
                vehicle,
            ) ),
        )
    }

    private createVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'vehicles.notifications.create.title',
            'vehicles.notifications.create.message',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx )
    }

    @Action( UpdateVehicle )
    public updateVehicle (ctx: StateContext<VehicleStateModel>, payload: UpdateVehicle): Observable<void> {
        return this.service.updateVehicleById( payload.projectId, payload.id, payload.vehicle ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.updateVehicleComplete(
                ctx,
                vehicle,
            ) ),
        )
    }

    private updateVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'vehicles.notifications.edit.title',
            'vehicles.notifications.edit.message',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx )
    }

    @Action( DisableVehicle )
    public disableVehicle (
        ctx: StateContext<VehicleStateModel>,
        payload: DisableVehicle,
    ): Observable<void> {
        return this.service.disableVehicleById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.disableVehicleComplete(
                ctx,
                vehicle,
            ) ),
        )
    }

    private disableVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'vehicles.notifications.disable.title',
            'vehicles.notifications.disable.message',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx )
    }

    @Action( EnableVehicle )
    public enableVehicle (ctx: StateContext<VehicleStateModel>, payload: EnableVehicle): Observable<void> {
        return this.service.enableVehicleById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (vehicle: VehicleModel): void => this.enableVehicleComplete(
                ctx,
                vehicle,
            ) ),
        )
    }

    private enableVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'vehicles.notifications.enable.title',
            'vehicles.notifications.enable.message',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx )
    }

    @Action( DeleteVehicle )
    public deleteVehicle (ctx: StateContext<VehicleStateModel>, payload: DeleteVehicle): Observable<void> {
        return this.service.deleteVehicleById( undefined, payload.vehicle.id ).pipe(
            initialize( (): void => this.facade.startVehicleLoader() ),
            finalize( (): void => this.facade.stopVehicleLoader() ),
            map( (): void => this.deleteVehicleComplete(
                ctx,
                payload.vehicle,
            ) ),
        )
    }

    private deleteVehicleComplete (
        ctx: StateContext<VehicleStateModel>,
        vehicle: VehicleModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'vehicles.notifications.delete.title',
            'vehicles.notifications.delete.message',
            this.vehicleIcon,
            this.buildTranslationArgs( vehicle ),
        )
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (vehicle: VehicleModel): object {
        return {
            registration: vehicle?.licensePlate,
            brand: vehicle?.brand,
            model: vehicle?.model,
        }
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
