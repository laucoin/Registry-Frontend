import { HttpErrorResponse } from '@angular/common/http'
import { Action, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import { MovementModel } from '../model/movement.model'
import {
    CreateMovement,
    DeleteMovement,
    DisableMovement,
    EnableMovement,
    FetchMovement,
    FetchMovementPage,
    InputMovementPageDateRange,
    InputMovementPageSearch,
    ResetMovement,
    SelectMovementPageOrder,
    SelectMovementPageType,
    SelectMovementPageVisibility,
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
import { MovementStateModel } from '../model/movement-state.model'

const defaultMovement: ElementRequestInformationModel<MovementModel> = {
    element: undefined,
    loading: false,
    error: undefined,
}

const defaultMovementState: MovementStateModel = {
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
    movement: defaultMovement,
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

    @Action( FetchMovementPage )
    public fetchMovementPage (ctx: StateContext<MovementStateModel>, payload: FetchMovementPage): Observable<void> {
        return this.service.findMovements(
            payload.eventId,
            payload.offset,
            payload.limit,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startPageLoader() ),
            finalize( (): void => this.facade.stopPageLoader() ),
            map( (movementPage: PageModel<MovementModel>): void => this.fetchMovementPageComplete(
                ctx,
                movementPage,
            ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchMovementPageComplete (
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

    @Action( InputMovementPageSearch )
    public inputMovementPageSearch (
        ctx: StateContext<MovementStateModel>,
        payload: InputMovementPageSearch,
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

    @Action( SelectMovementPageType )
    public selectMovementPageType (
        ctx: StateContext<MovementStateModel>,
        payload: SelectMovementPageType,
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

    @Action( InputMovementPageDateRange )
    public inputMovementPageDateRange (
        ctx: StateContext<MovementStateModel>,
        payload: InputMovementPageDateRange,
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

    @Action( SelectMovementPageVisibility )
    public selectMovementPageVisibility (
        ctx: StateContext<MovementStateModel>,
        payload: SelectMovementPageVisibility,
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

    @Action( SelectMovementPageOrder )
    public selectMovementPageOrder (
        ctx: StateContext<MovementStateModel>,
        payload: SelectMovementPageOrder,
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

    @Action( FetchMovement )
    public fetchMovement (ctx: StateContext<MovementStateModel>, payload: FetchMovement): Observable<void> {
        return this.service.findMovementById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (movement: MovementModel): void => this.fetchMovementComplete( ctx, movement ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
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

    @Action( ResetMovement )
    public resetMovement (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movement: defaultMovement,
        } )
    }

    @Action( CreateMovement )
    public createMovement (ctx: StateContext<MovementStateModel>, payload: CreateMovement): Observable<void> {
        return this.service.createMovement( payload.eventId, payload.movement ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (movement: MovementModel): void => this.createMovementComplete( ctx, payload.eventId, movement ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
        )
    }

    private createMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type}.create`,
            `success.message.movement.${movement.type}.create.${movement.content.length <= 1 ? 'singular' : 'plural'}`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( UpdateMovement )
    public updateMovement (ctx: StateContext<MovementStateModel>, payload: UpdateMovement): Observable<void> {
        return this.service.updateMovementById( payload.eventId, payload.id, payload.movement ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (movement: MovementModel): void => this.updateMovementComplete( ctx, payload.eventId, movement ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
        )
    }

    private updateMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type}.edit`,
            `success.message.movement.${movement.type}.edit`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DisableMovement )
    public disableMovement (ctx: StateContext<MovementStateModel>, payload: DisableMovement): Observable<void> {
        return this.service.disableMovementById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (movement: MovementModel): void => this.disableMovementComplete( ctx, payload.eventId, movement ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
        )
    }

    private disableMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type}.disable`,
            `success.message.movement.${movement.type}.disable"`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( EnableMovement )
    public enableMovement (ctx: StateContext<MovementStateModel>, payload: EnableMovement): Observable<void> {
        return this.service.enableMovementById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (movement: MovementModel): void => this.enableMovementComplete( ctx, payload.eventId, movement ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
        )
    }

    private enableMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type}.enable`,
            `success.message.movement.${movement.type}.enable"`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DeleteMovement )
    public deleteMovement (ctx: StateContext<MovementStateModel>, payload: DeleteMovement): Observable<void> {
        return this.service.deleteMovementById( undefined, payload.movement.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
            map( (): void => this.deleteMovementComplete( ctx, payload.eventId, payload.movement ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.elementError( ctx, error ) ),
        )
    }

    private deleteMovementComplete (
        ctx: StateContext<MovementStateModel>,
        eventId: string | undefined,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `success.title.movement.${movement.type}.delete`,
            `success.message.movement.${movement.type}.delete"`,
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
        this.facade.fetchElementPage( page?.offset, page?.limit, true, eventId )
    }

    protected pageError (ctx: StateContext<MovementStateModel>, error: HttpErrorResponse): Observable<void> {
        if (error.status == 503) {
            this.registryFacade.setGlobalError( error )
        } else {
            ctx.patchState( {
                movements: this.buildErrorMessageAndNotify( ctx.getState().movements, error ),
            } )
        }
        throw error.error
    }

    protected elementError (ctx: StateContext<MovementStateModel>, error: HttpErrorResponse): Observable<void> {
        if (error.status == 503) {
            this.registryFacade.setGlobalError( error )
        } else {
            ctx.patchState( {
                movement: this.buildErrorMessageAndNotify( ctx.getState().movement, error ),
            } )
        }
        throw error.error
    }
}
