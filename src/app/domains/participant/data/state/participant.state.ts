import { Action, State, StateContext } from '@ngxs/store'
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
    FetchParticipantPage,
    InputParticipantPageDateRange,
    InputParticipantPageSearch,
    ResetParticipant,
    SearchGroups,
    SearchUsers,
    SelectParticipantPageOrder,
    SelectParticipantPageVisibility,
    StartParticipantLoader,
    StartParticipantsPageLoader,
    StopParticipantLoader,
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
import { SelectItem } from 'primeng/api'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GroupUtil } from '../../../../shared/util-tool/util/group.util'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'

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
    participant: defaultParticipant,
    searchedUsers: [],
    searchedGroups: [],
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
        private readonly facade: ParticipantFacade,
    ) {
        super()
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

    @Action( FetchParticipantPage )
    public fetchParticipantPage (
        ctx: StateContext<ParticipantStateModel>,
        payload: FetchParticipantPage,
    ): Observable<void> {
        return this.service.findParticipants(
            payload.eventId,
            payload.offset,
            payload.limit,
            ctx.getState().participants.params,
        ).pipe(
            initialize( (): void => this.facade.startPageLoader() ),
            finalize( (): void => this.facade.stopPageLoader() ),
            map( (participantPage: PageModel<ParticipantModel>): void => this.fetchParticipantPageComplete(
                ctx,
                participantPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchParticipantPageComplete (
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

    @Action( InputParticipantPageSearch )
    public inputParticipantPageSearch (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantPageSearch,
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

    @Action( InputParticipantPageDateRange )
    public inputParticipantPageDateRange (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantPageDateRange,
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

    @Action( SelectParticipantPageVisibility )
    public selectParticipantPageVisibility (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantPageVisibility,
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

    @Action( SelectParticipantPageOrder )
    public selectParticipantPageOrder (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantPageOrder,
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

    @Action( FetchParticipant )
    public fetchParticipant (ctx: StateContext<ParticipantStateModel>, payload: FetchParticipant): Observable<void> {
        return this.service.findParticipantById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            searchedUsers: users.map( (user: UserModel): SelectItem<UserModel> => UserUtil.toSelectItem( user ) ),
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
            searchedGroups: groups.map( (group: GroupModel): SelectItem<GroupModel> => GroupUtil.toSelectItem( group ) ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
        this.facade.fetchElementPage( page?.offset, page?.limit, true, eventId )
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
}
