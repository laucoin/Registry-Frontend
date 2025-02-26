import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import {
    CreateMovement,
    DeleteMovement,
    DisableMovement,
    EnableMovement,
    FetchMovement,
    FetchMovementsPage,
    FetchMovementTypes,
    InputMovementsPageDateRange,
    InputMovementsPageSearch,
    ResetMovement,
    SearchParticipantsAndGroups,
    SearchVehicles,
    SelectMovementsPageOrder,
    SelectMovementsPageType,
    SelectMovementsPageVisibility,
    StartMovementLoader,
    StartMovementsPageLoader,
    StopMovementLoader,
    StopMovementsPageLoader,
    UpdateMovement,
} from './movement.action'
import { MovementService } from './movement.service'
import { MovementFacade } from './movement.facade'
import { TranslateService } from '@ngx-translate/core'
import { DatePipe } from '@angular/common'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { Injectable } from '@angular/core'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GroupUtil } from '../../../../shared/util-tool/util/group.util'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { MovementModel } from '../../../../shared/util-model/movement.model'
import { MovementStateModel } from '../model/movement-state.model'
import {
    MovementParticipantsAndGroupsModel,
} from '../../../../shared/util-model/model/movement-participants-and-groups.model'
import { ParticipantUtil } from '../../../../shared/util-tool/util/participant.util'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { VehicleUtil } from '../../../../shared/util-tool/util/vehicle.util'

const defaultMovement: ElementRequestInformationModel<MovementModel> = {
    element: undefined,
    loading: false,
}

const defaultMovementState: MovementStateModel = {
    movements: {
        element: undefined,
        params: {
            order: OrderEnum.DESC,
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
    movement: defaultMovement,
    _metadata: {
        types: [],
        searchedParticipantsAndGroups: [],
        searchedVehicles: [],
    },
}

@State<MovementStateModel>( {
    name: 'movement',
    defaults: defaultMovementState,
} )
@Injectable()
export class MovementState extends GenericEventElementState<MovementStateModel> {
    private readonly movementIcon: string = 'pi pi-sort-alt'

    public constructor (
        private readonly service: MovementService,
        private readonly facade: MovementFacade,
        private readonly translateService: TranslateService,
        private readonly datePipe: DatePipe,
    ) {
        super()
    }

    @Selector()
    public static movementsPage (state: MovementStateModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static movementsPageLoading (state: MovementStateModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static movementsPageError (state: MovementStateModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static movementsPageSilentLoading (state: MovementStateModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static movementsPageSearchParam (state: MovementStateModel): string | undefined {
        return state.movements.params.searched
    }

    @Selector()
    public static movementsPageMovementTypeParam (state: MovementStateModel): string | undefined {
        return state.movements.params.type
    }

    @Selector()
    public static movementsPageStartDateParam (state: MovementStateModel): string | undefined {
        return state.movements.params.startDate
    }

    @Selector()
    public static movementsPageEndDateParam (state: MovementStateModel): string | undefined {
        return state.movements.params.endDate
    }

    @Selector()
    public static movementsPageOnlyVisibleParam (state: MovementStateModel): boolean {
        return state.movements.params.onlyVisible
    }

    @Selector()
    public static movementsPageOrderParam (state: MovementStateModel): OrderEnum {
        return state.movements.params.order
    }

    @Selector()
    public static movement (state: MovementStateModel): MovementModel | undefined {
        return state.movement.element
    }

    @Selector()
    public static movementLoading (state: MovementStateModel): boolean {
        return state.movement.loading
    }

    @Selector()
    public static searchedParticipantAndGroupMetadata (state: MovementStateModel): SelectItemGroup<ParticipantModel | GroupModel>[] {
        return state._metadata.searchedParticipantsAndGroups
    }

    @Selector()
    public static searchedVehicleMetadata (state: MovementStateModel): SelectItem<VehicleModel>[] {
        return state._metadata.searchedVehicles
    }

    @Selector()
    public static movementTypesMetadata (state: MovementStateModel): SelectItem<string>[] {
        return state._metadata.types
    }

    @Action( FetchMovementTypes )
    public fetchMovementTypes (ctx: StateContext<MovementStateModel>, payload: FetchMovementTypes): Observable<void> {
        return this.service.getAvailableMovementTypes( payload.eventId ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (types: SelectItem<string>[]): void => this.fetchMovementTypesComplete( ctx, types ) ),
        )
    }

    private fetchMovementTypesComplete (
        ctx: StateContext<MovementStateModel>,
        types: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                types: types,
            },
        } )
    }

    @Action( StartMovementsPageLoader )
    public startMovementsPageLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopMovementsPageLoader )
    public stopMovementsPageLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchMovementsPage )
    public fetchMovementsPage (ctx: StateContext<MovementStateModel>, payload: FetchMovementsPage): Observable<void> {
        return this.service.findMovements(
            payload.eventId,
            payload.offset,
            payload.limit,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startMovementsPageLoader() ),
            finalize( (): void => this.facade.stopMovementsPageLoader() ),
            map( (movementPage: PageModel<MovementModel>): void => this.fetchMovementsPageComplete(
                ctx,
                movementPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchMovementsPageComplete (
        ctx: StateContext<MovementStateModel>,
        movementPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                element: movementPage,
            },
        } )
    }

    @Action( InputMovementsPageSearch )
    public inputMovementsPageSearch (
        ctx: StateContext<MovementStateModel>,
        payload: InputMovementsPageSearch,
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

    @Action( SelectMovementsPageType )
    public selectMovementsPageType (
        ctx: StateContext<MovementStateModel>,
        payload: SelectMovementsPageType,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    type: payload.type,
                },
            },
        } )
    }

    @Action( InputMovementsPageDateRange )
    public inputMovementsPageDateRange (
        ctx: StateContext<MovementStateModel>,
        payload: InputMovementsPageDateRange,
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

    @Action( SelectMovementsPageVisibility )
    public selectMovementsPageVisibility (
        ctx: StateContext<MovementStateModel>,
        payload: SelectMovementsPageVisibility,
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

    @Action( SelectMovementsPageOrder )
    public selectMovementsPageOrder (
        ctx: StateContext<MovementStateModel>,
        payload: SelectMovementsPageOrder,
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

    @Action( StartMovementLoader )
    public startMovementLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movement: StateUtil.updateElementLoader( ctx.getState().movement, true ),
        } )
    }

    @Action( StopMovementLoader )
    public stopMovementLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movement: StateUtil.updateElementLoader( ctx.getState().movement, false ),
        } )
    }

    @Action( FetchMovement )
    public fetchMovement (ctx: StateContext<MovementStateModel>, payload: FetchMovement): Observable<void> {
        return this.service.findMovementById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.fetchMovementComplete( ctx, movement ) ),
        )
    }

    private fetchMovementComplete (ctx: StateContext<MovementStateModel>, movement: MovementModel): void {
        ctx.patchState( {
            movement: {
                ...ctx.getState().movement,
                element: movement,
            },
        } )
    }

    @Action( SearchParticipantsAndGroups )
    public searchParticipantsAndGroups (
        ctx: StateContext<MovementStateModel>,
        payload: SearchParticipantsAndGroups,
    ): Observable<void> {
        return this.service.searchParticipantsAndGroups( payload.eventId, payload.searched ).pipe(
            map( (participantsAndGroups: MovementParticipantsAndGroupsModel): void => this.searchParticipantsAndGroupsComplete(
                ctx,
                participantsAndGroups,
            ) ),
        )
    }

    private searchParticipantsAndGroupsComplete (
        ctx: StateContext<MovementStateModel>,
        participantsAndGroups: MovementParticipantsAndGroupsModel,
    ): void {
        const searched: SelectItemGroup<ParticipantModel | GroupModel>[] = []

        if (participantsAndGroups.participants?.length > 0) {
            searched.push( {
                label: this.translateService.instant( 'movement.searched.participant.' + (participantsAndGroups.participants.length > 1 ? 'plural' : 'singular') ),
                items: participantsAndGroups.participants.map(
                    (participant: ParticipantModel): SelectItem<ParticipantModel> =>
                        ParticipantUtil.toSelectItem( participant ),
                ),
            } )
        }

        if (participantsAndGroups.groups.length > 0) {
            searched.push( {
                label: this.translateService.instant( 'movement.searched.group.' + (participantsAndGroups.participants.length > 1 ? 'plural' : 'singular') ),
                items: participantsAndGroups.groups.map( (group: GroupModel): SelectItem<GroupModel> =>
                    GroupUtil.toSelectItem( group ),
                ),
            } )
        }

        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedParticipantsAndGroups: searched,
            },
        } )
    }

    @Action( SearchVehicles )
    public searchVehicles (
        ctx: StateContext<MovementStateModel>,
        payload: SearchVehicles,
    ): Observable<void> {
        return this.service.searchVehicles( payload.eventId, payload.searched ).pipe(
            map( (vehicles: VehicleModel[]): void => this.searchVehiclesComplete(
                ctx,
                vehicles,
            ) ),
        )
    }

    private searchVehiclesComplete (
        ctx: StateContext<MovementStateModel>,
        vehicles: VehicleModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedVehicles: vehicles.map( (vehicle: VehicleModel): SelectItem<VehicleModel> =>
                    VehicleUtil.toSelectItem( vehicle ),
                ),
            },
        } )
    }

    @Action( ResetMovement )
    public resetMovement (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movement: defaultMovement,
        } )
    }

    @Action( CreateMovement )
    public createMovement (ctx: StateContext<MovementStateModel>, payload: CreateMovement): Observable<void> {
        return this.service.createMovement( payload.eventId, payload.movement ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.createMovementComplete( ctx, payload.eventId, movement ) ),
        )
    }

    private createMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type.value}.create`,
            `success.message.movement.${movement.type.value}.create.${movement.content.length <= 1 ? 'singular' : 'plural'}`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( UpdateMovement )
    public updateMovement (ctx: StateContext<MovementStateModel>, payload: UpdateMovement): Observable<void> {
        return this.service.updateMovementById( payload.eventId, payload.id, payload.movement ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.updateMovementComplete( ctx, payload.eventId, movement ) ),
        )
    }

    private updateMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type.value}.edit`,
            `success.message.movement.${movement.type.value}.edit`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DisableMovement )
    public disableMovement (ctx: StateContext<MovementStateModel>, payload: DisableMovement): Observable<void> {
        return this.service.disableMovementById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.disableMovementComplete( ctx, payload.eventId, movement ) ),
        )
    }

    private disableMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type.value}.disable`,
            `success.message.movement.${movement.type.value}.disable"`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( EnableMovement )
    public enableMovement (ctx: StateContext<MovementStateModel>, payload: EnableMovement): Observable<void> {
        return this.service.enableMovementById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.enableMovementComplete( ctx, payload.eventId, movement ) ),
        )
    }

    private enableMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type.value}.enable`,
            `success.message.movement.${movement.type.value}.enable"`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DeleteMovement )
    public deleteMovement (ctx: StateContext<MovementStateModel>, payload: DeleteMovement): Observable<void> {
        return this.service.deleteMovementById( undefined, payload.movement.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (): void => this.deleteMovementComplete( ctx, payload.eventId, payload.movement ) ),
        )
    }

    private deleteMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type.value}.delete`,
            `success.message.movement.${movement.type.value}.delete"`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    private buildTranslationArgs (movement: MovementModel): object {
        return {
            date: this.datePipe.transform(
                movement?.dateTime,
                this.translateService.instant( 'datetime.format.date' ),
            ),
            time: this.datePipe.transform(
                movement?.dateTime,
                this.translateService.instant( 'datetime.format.time' ),
            ),
        }
    }

    protected refreshPage (ctx: StateContext<MovementStateModel>, eventId: string | undefined): void {
        const page: PageModel<MovementModel> | undefined = ctx.getState().movements.element
        this.facade.fetchMovementsPage( page?.offset, page?.limit, true, eventId )
    }

    protected pageError (ctx: StateContext<MovementStateModel>, error: ErrorModel): Observable<void> {
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
