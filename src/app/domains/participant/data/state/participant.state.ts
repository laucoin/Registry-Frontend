import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import { ParticipantStateModel } from '../model/participant-state.model'
import {
    CreateParticipant,
    DeleteParticipant,
    DisableParticipant,
    EnableParticipant,
    FetchParticipant,
    FetchParticipantMovementsPage,
    FetchParticipantMovementTypes,
    FetchParticipantsPage,
    InputParticipantMovementsPageDateRange,
    InputParticipantMovementsPageSearch,
    InputParticipantsPageDateRange,
    InputParticipantsPageSearch,
    ResetParticipant,
    SearchGroups,
    SearchUsers,
    SelectParticipantMovementsPageOrder,
    SelectParticipantMovementsPageVisibility,
    SelectParticipantsPageOrder,
    SelectParticipantsPageVisibility,
    StartParticipantLoader,
    StartParticipantMovementsPageLoader,
    StartParticipantsPageLoader,
    StopParticipantLoader,
    StopParticipantMovementsPageLoader,
    StopParticipantsPageLoader,
    UpdateParticipant,
} from './participant.action'
import { ParticipantService } from './participant.service'
import { ParticipantFacade } from './participant.facade'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { Injectable } from '@angular/core'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { UserUtil } from '../../../../shared/util-tool/util/user.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GroupUtil } from '../../../../shared/util-tool/util/group.util'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { MovementModel } from '../../../../shared/util-model/movement.model'
import { MovementService } from '../../../movement/data/state/movement.service'

const defaultParticipant: ElementRequestInformationModel<ParticipantModel> = {
    element: undefined,
    loading: false,
}

const defaultParticipantState: ParticipantStateModel = {
    participants: {
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
    participant: defaultParticipant,
    _metadata: {
        searchedUsers: [],
        searchedGroups: [],
        movementTypes: [],
    },
}

@State<ParticipantStateModel>( {
    name: 'participant',
    defaults: defaultParticipantState,
} )
@Injectable()
export class ParticipantState extends GenericEventElementState<ParticipantStateModel> {
    private readonly participantIcon: string = 'pi pi-users'

    public constructor (
        private readonly service: ParticipantService,
        private readonly movementService: MovementService,
        private readonly facade: ParticipantFacade,
    ) {
        super()
    }

    @Selector()
    public static participantsPage (state: ParticipantStateModel): PageModel<ParticipantModel> | undefined {
        return state.participants.element
    }

    @Selector()
    public static participantsPageLoading (state: ParticipantStateModel): boolean {
        return state.participants.loading
    }

    @Selector()
    public static participantsPageError (state: ParticipantStateModel): ToastMessageOptions | undefined {
        return state.participants.error
    }

    @Selector()
    public static participantsPageSilentLoading (state: ParticipantStateModel): boolean {
        return state.participants.silentLoading
    }

    @Selector()
    public static participantsPageSearchParam (state: ParticipantStateModel): string | undefined {
        return state.participants.params.searched
    }

    @Selector()
    public static participantsPageStartDateParam (state: ParticipantStateModel): string | undefined {
        return state.participants.params.startDate
    }

    @Selector()
    public static participantsPageEndDateParam (state: ParticipantStateModel): string | undefined {
        return state.participants.params.endDate
    }

    @Selector()
    public static participantsPageOnlyVisibleParam (state: ParticipantStateModel): boolean {
        return state.participants.params.onlyVisible
    }

    @Selector()
    public static participantsPageOrderParam (state: ParticipantStateModel): OrderEnum {
        return state.participants.params.order
    }

    @Selector()
    public static participantMovementsPage (state: ParticipantStateModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static participantMovementsPageLoading (state: ParticipantStateModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static participantMovementsPageError (state: ParticipantStateModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static participantMovementsPageSilentLoading (state: ParticipantStateModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static participantMovementsPageSearchParam (state: ParticipantStateModel): string | undefined {
        return state.movements.params.searched
    }

    @Selector()
    public static participantMovementsPageMovementTypeParam (state: ParticipantStateModel): string | undefined {
        return state.movements.params.searched
    }

    @Selector()
    public static participantMovementsPageStartDateParam (state: ParticipantStateModel): string | undefined {
        return state.movements.params.startDate
    }

    @Selector()
    public static participantMovementsPageEndDateParam (state: ParticipantStateModel): string | undefined {
        return state.movements.params.endDate
    }

    @Selector()
    public static participantMovementsPageOnlyVisibleParam (state: ParticipantStateModel): boolean {
        return state.movements.params.onlyVisible
    }

    @Selector()
    public static participantMovementsPageOrderParam (state: ParticipantStateModel): OrderEnum {
        return state.movements.params.order
    }

    @Selector()
    public static participant (state: ParticipantStateModel): ParticipantModel | undefined {
        return state.participant.element
    }

    @Selector()
    public static participantLoading (state: ParticipantStateModel): boolean {
        return state.participant.loading
    }

    @Selector()
    public static searchedUsersMetadata (state: ParticipantStateModel): SelectItem<UserDto>[] {
        return state._metadata.searchedUsers
    }

    @Selector()
    public static searchedGroupsMetadata (state: ParticipantStateModel): SelectItem<GroupModel>[] {
        return state._metadata.searchedGroups
    }

    @Selector()
    public static movementTypesMetadata (state: ParticipantStateModel): SelectItem<string>[] {
        return state._metadata.movementTypes
    }

    @Action( StartParticipantsPageLoader )
    public startParticipantsPageLoader (ctx: StateContext<ParticipantStateModel>): void {
        ctx.patchState( {
            participants: StateUtil.updatePageLoader( ctx.getState().participants, true ),
        } )
    }

    @Action( StopParticipantsPageLoader )
    public stopParticipantsPageLoader (ctx: StateContext<ParticipantStateModel>): void {
        ctx.patchState( {
            participants: StateUtil.updatePageLoader( ctx.getState().participants, false ),
        } )
    }

    @Action( FetchParticipantsPage )
    public fetchParticipantsPage (
        ctx: StateContext<ParticipantStateModel>,
        payload: FetchParticipantsPage,
    ): Observable<void> {
        return this.service.findParticipants(
            payload.eventId,
            payload.offset,
            payload.limit,
            ctx.getState().participants.params,
        ).pipe(
            initialize( (): void => this.facade.startParticipantsPageLoader() ),
            finalize( (): void => this.facade.stopParticipantsPageLoader() ),
            map( (participantPage: PageModel<ParticipantModel>): void => this.fetchParticipantsPageComplete(
                ctx,
                participantPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchParticipantsPageComplete (
        ctx: StateContext<ParticipantStateModel>,
        participantPage: PageModel<ParticipantModel>,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                element: participantPage,
            },
        } )
    }

    @Action( InputParticipantsPageSearch )
    public inputParticipantsPageSearch (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantsPageSearch,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: {
                    ...ctx.getState().participants.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputParticipantsPageDateRange )
    public inputParticipantsPageDateRange (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantsPageDateRange,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: {
                    ...ctx.getState().participants.params,
                    startDate: payload.start?.toISOString(),
                    endDate: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectParticipantsPageVisibility )
    public selectParticipantsPageVisibility (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantsPageVisibility,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: {
                    ...ctx.getState().participants.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectParticipantsPageOrder )
    public selectParticipantsPageOrder (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantsPageOrder,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: {
                    ...ctx.getState().participants.params,
                    order: payload.order,
                },
            },
        } )
    }

    @Action( StartParticipantMovementsPageLoader )
    public startParticipantMovementsPageLoader (ctx: StateContext<ParticipantStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopParticipantMovementsPageLoader )
    public stopParticipantMovementsPageLoader (ctx: StateContext<ParticipantStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchParticipantMovementTypes )
    public fetchParticipantMovementTypes (
        ctx: StateContext<ParticipantStateModel>,
        payload: FetchParticipantMovementTypes,
    ): Observable<void> {
        return this.movementService.getAvailableMovementTypes( payload.eventId ).pipe(
            map( (types: SelectItem<string>[]): void => this.fetchParticipantMovementTypesComplete( ctx, types ) ),
        )
    }

    private fetchParticipantMovementTypesComplete (
        ctx: StateContext<ParticipantStateModel>,
        movementTypes: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                movementTypes: movementTypes,
            },
        } )
    }

    @Action( FetchParticipantMovementsPage )
    public fetchParticipantMovementsPage (
        ctx: StateContext<ParticipantStateModel>,
        payload: FetchParticipantMovementsPage,
    ): Observable<void> {
        return this.service.findParticipantMovements(
            payload.eventId,
            payload.id,
            payload.offset,
            payload.limit,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startParticipantMovementsPageLoader() ),
            finalize( (): void => this.facade.stopParticipantMovementsPageLoader() ),
            map( (movementsPage: PageModel<MovementModel>): void => this.fetchParticipantMovementsPageComplete(
                ctx,
                movementsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.movementsPageError( ctx, error ) ),
        )
    }

    private fetchParticipantMovementsPageComplete (
        ctx: StateContext<ParticipantStateModel>,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                element: movementsPage,
            },
        } )
    }

    @Action( InputParticipantMovementsPageSearch )
    public inputParticipantMovementsPageSearch (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantsPageSearch,
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

    @Action( InputParticipantMovementsPageDateRange )
    public inputParticipantMovementsPageDateRange (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantsPageDateRange,
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

    @Action( SelectParticipantMovementsPageVisibility )
    public selectParticipantMovementsPageVisibility (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantsPageVisibility,
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

    @Action( SelectParticipantMovementsPageOrder )
    public selectParticipantMovementsPageOrder (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantsPageOrder,
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

    @Action( StartParticipantLoader )
    public startParticipantLoader (ctx: StateContext<ParticipantStateModel>): void {
        ctx.patchState( {
            participant: StateUtil.updateElementLoader( ctx.getState().participant, true ),
        } )
    }

    @Action( StopParticipantLoader )
    public stopParticipantLoader (ctx: StateContext<ParticipantStateModel>): void {
        ctx.patchState( {
            participant: StateUtil.updateElementLoader( ctx.getState().participant, false ),
        } )
    }

    @Action( FetchParticipant )
    public fetchParticipant (ctx: StateContext<ParticipantStateModel>, payload: FetchParticipant): Observable<void> {
        return this.service.findParticipantById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startParticipantLoader() ),
            finalize( (): void => this.facade.stopParticipantLoader() ),
            map( (participant: ParticipantModel): void => this.fetchParticipantComplete( ctx, participant ) ),
        )
    }

    private fetchParticipantComplete (
        ctx: StateContext<ParticipantStateModel>,
        participant: ParticipantModel,
    ): void {
        ctx.patchState( {
            participant: {
                ...ctx.getState().participant,
                element: participant,
            },
        } )
    }

    @Action( SearchUsers )
    public searchUsers (
        ctx: StateContext<ParticipantStateModel>,
        payload: SearchUsers,
    ): Observable<void> {
        return this.service.searchUsers(
            payload.eventId,
            payload.searched,
        ).pipe(
            map( (users: UserModel[]): void => this.searchUsersComplete(
                ctx,
                users,
            ) ),
        )
    }

    private searchUsersComplete (
        ctx: StateContext<ParticipantStateModel>,
        users: UserModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedUsers: users.map( (user: UserModel): SelectItem<UserModel> => UserUtil.toSelectItem( user ) ),
            },
        } )
    }

    @Action( SearchGroups )
    public searchGroups (
        ctx: StateContext<ParticipantStateModel>,
        payload: SearchGroups,
    ): Observable<void> {
        return this.service.searchGroups(
            payload.eventId,
            payload.searched,
        ).pipe(
            map( (groups: GroupModel[]): void => this.searchGroupsComplete(
                ctx,
                groups,
            ) ),
        )
    }

    private searchGroupsComplete (
        ctx: StateContext<ParticipantStateModel>,
        groups: GroupModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedGroups: groups.map( (group: GroupModel): SelectItem<GroupModel> => GroupUtil.toSelectItem( group ) ),
            },
        } )
    }

    @Action( ResetParticipant )
    public resetParticipant (ctx: StateContext<ParticipantStateModel>): void {
        ctx.patchState( {
            participant: defaultParticipant,
        } )
    }

    @Action( CreateParticipant )
    public createParticipant (ctx: StateContext<ParticipantStateModel>, payload: CreateParticipant): Observable<void> {
        return this.service.createParticipant( payload.eventId, payload.participant ).pipe(
            initialize( (): void => this.facade.startParticipantLoader() ),
            finalize( (): void => this.facade.stopParticipantLoader() ),
            map( (participant: ParticipantModel): void => this.createParticipantComplete(
                ctx,
                payload.eventId,
                participant,
            ) ),
        )
    }

    private createParticipantComplete (
        ctx: StateContext<ParticipantStateModel>,
        eventId: string | undefined,
        participant: ParticipantModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.participant.create',
            'success.message.participant.create',
            this.participantIcon,
            this.buildTranslationArgs( participant ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( UpdateParticipant )
    public updateParticipant (ctx: StateContext<ParticipantStateModel>, payload: UpdateParticipant): Observable<void> {
        return this.service.updateParticipantById( payload.eventId, payload.id, payload.participant ).pipe(
            initialize( (): void => this.facade.startParticipantLoader() ),
            finalize( (): void => this.facade.stopParticipantLoader() ),
            map( (participant: ParticipantModel): void => this.updateParticipantComplete(
                ctx,
                payload.eventId,
                participant,
            ) ),
        )
    }

    private updateParticipantComplete (
        ctx: StateContext<ParticipantStateModel>,
        eventId: string | undefined,
        participant: ParticipantModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.participant.edit',
            'success.message.participant.edit',
            this.participantIcon,
            this.buildTranslationArgs( participant ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DisableParticipant )
    public disableParticipant (
        ctx: StateContext<ParticipantStateModel>,
        payload: DisableParticipant,
    ): Observable<void> {
        return this.service.disableParticipantById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startParticipantLoader() ),
            finalize( (): void => this.facade.stopParticipantLoader() ),
            map( (participant: ParticipantModel): void => this.disableParticipantComplete(
                ctx,
                payload.eventId,
                participant,
            ) ),
        )
    }

    private disableParticipantComplete (
        ctx: StateContext<ParticipantStateModel>,
        eventId: string | undefined,
        participant: ParticipantModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.participant.disable',
            'success.message.participant.disable',
            this.participantIcon,
            this.buildTranslationArgs( participant ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( EnableParticipant )
    public enableParticipant (ctx: StateContext<ParticipantStateModel>, payload: EnableParticipant): Observable<void> {
        return this.service.enableParticipantById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startParticipantLoader() ),
            finalize( (): void => this.facade.stopParticipantLoader() ),
            map( (participant: ParticipantModel): void => this.enableParticipantComplete(
                ctx,
                payload.eventId,
                participant,
            ) ),
        )
    }

    private enableParticipantComplete (
        ctx: StateContext<ParticipantStateModel>,
        eventId: string | undefined,
        participant: ParticipantModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.participant.enable',
            'success.message.participant.enable',
            this.participantIcon,
            this.buildTranslationArgs( participant ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DeleteParticipant )
    public deleteParticipant (ctx: StateContext<ParticipantStateModel>, payload: DeleteParticipant): Observable<void> {
        return this.service.deleteParticipantById( undefined, payload.participant.id ).pipe(
            initialize( (): void => this.facade.startParticipantLoader() ),
            finalize( (): void => this.facade.stopParticipantLoader() ),
            map( (): void => this.deleteParticipantComplete(
                ctx,
                payload.eventId,
                payload.participant,
            ) ),
        )
    }

    private deleteParticipantComplete (
        ctx: StateContext<ParticipantStateModel>,
        eventId: string | undefined,
        participant: ParticipantModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.participant.delete',
            'success.message.participant.delete',
            this.participantIcon,
            this.buildTranslationArgs( participant ),
        )
        this.refreshPage( ctx, eventId )
    }

    private buildTranslationArgs (participant: ParticipantModel): object {
        return {
            firstName: participant?.firstName,
            lastName: participant?.lastName,
        }
    }

    protected refreshPage (ctx: StateContext<ParticipantStateModel>, eventId: string | undefined): void {
        const page: PageModel<ParticipantModel> | undefined = ctx.getState().participants.element
        this.facade.fetchParticipantsPage( page?.offset, page?.limit, true, eventId )
    }

    protected pageError (ctx: StateContext<ParticipantStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                participants: this.buildErrorMessage( ctx.getState().participants, error ),
            } )
        }

        return of()
    }

    protected movementsPageError (ctx: StateContext<ParticipantStateModel>, error: ErrorModel): Observable<void> {
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
