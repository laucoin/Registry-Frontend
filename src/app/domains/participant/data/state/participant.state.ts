import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
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
    FetchParticipantMovementsContents,
    FetchParticipantMovementsPage,
    FetchParticipantPresencesStatus,
    FetchParticipantsPage,
    InputParticipantMovementsPageEndDateTimeSearched,
    InputParticipantMovementsPageStartDateTimeSearched,
    InputParticipantsPageTextSearched,
    ResetParticipant,
    SearchGroups,
    SearchUsers,
    SelectParticipantMovementsPageTypeSearched,
    SelectParticipantMovementsPageVisibilitySearched,
    SelectParticipantsPageStatusSearched,
    SelectParticipantsPageVisibilitySearched,
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
import { Injectable } from '@angular/core'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { UserUtil } from '../../../../shared/util-tool/util/user.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GroupUtil } from '../../../../shared/util-tool/util/group.util'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { MovementService } from '../../../movement/data/state/movement.service'
import { PairModel } from '../../../../shared/util-model/model/pair.model'
import { MovementContentModel } from '../../../../shared/util-model/model/movement-content.model'
import { MovementUtil } from '../../../../shared/util-tool/util/movement.util'
import { MetadataService } from '../../../../shared/util-common/state/metadata.service'

const defaultParticipant: ElementRequestInformationModel<ParticipantModel> = {
    element: undefined,
    loading: false,
}

const defaultParticipantState: ParticipantStateModel = {
    participants: {
        element: undefined,
        params: {
            textSearched: undefined,
            visibilitySearched: undefined,
            statusSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    movements: {
        element: undefined,
        params: {
            visibilitySearched: undefined,
            typeSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    participant: defaultParticipant,
    _metadata: {
        searchedUsers: [],
        searchedGroups: [],
        presencesStatus: [],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'participants.visible.true', value: true },
            { label: 'participants.visible.false', value: false },
        ],
    },
}

@State<ParticipantStateModel>( {
    name: 'participant',
    defaults: defaultParticipantState,
} )
@Injectable()
export class ParticipantState extends GenericEventElementState<ParticipantStateModel> implements NgxsOnInit {
    private readonly participantIcon: string = 'pi pi-users'

    public constructor (
        private readonly service: ParticipantService,
        private readonly metadataService: MetadataService,
        private readonly movementService: MovementService,
        private readonly facade: ParticipantFacade,
    ) {
        super()
    }

    public ngxsOnInit (): void {
        this.facade.fetchPresencesStatus()
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
    public static participantsPageTextSearchedParam (state: ParticipantStateModel): string | undefined {
        return state.participants.params.textSearched
    }

    @Selector()
    public static participantsPageStatusSearchedParam (state: ParticipantStateModel): string | undefined {
        return state.participants.params.statusSearched
    }

    @Selector()
    public static participantsPageVisibilitySearchedParam (state: ParticipantStateModel): boolean | undefined {
        return state.participants.params.visibilitySearched
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
    public static participantMovementsPageMovementTypeSearchedParam (state: ParticipantStateModel): string | undefined {
        return state.movements.params.typeSearched
    }

    @Selector()
    public static participantMovementsPageStartDateTimeSearchedParam (state: ParticipantStateModel): string | undefined {
        return state.movements.params.startDateTimeSearched
    }

    @Selector()
    public static participantMovementsPageEndDateTimeSearchedParam (state: ParticipantStateModel): string | undefined {
        return state.movements.params.endDateTimeSearched
    }

    @Selector()
    public static participantMovementsPageVisibilitySearchedParam (state: ParticipantStateModel): boolean | undefined {
        return state.movements.params.visibilitySearched
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
    public static searchedUsersMetadata (state: ParticipantStateModel): SelectItem<UserModel>[] {
        return state._metadata.searchedUsers
    }

    @Selector()
    public static searchedGroupsMetadata (state: ParticipantStateModel): SelectItem<GroupModel>[] {
        return state._metadata.searchedGroups
    }

    @Selector()
    public static presencesStatusMetadata (state: ParticipantStateModel): SelectItem<string | undefined>[] {
        return state._metadata.presencesStatus
    }

    @Selector()
    public static visibilitiesMetadata (state: ParticipantStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( FetchParticipantPresencesStatus )
    public fetchParticipantPresencesStatus (ctx: StateContext<ParticipantStateModel>): Observable<void> {
        return this.metadataService.getPresencesStatus().pipe(
            map( (types: SelectItem<string>[]): void => this.fetchParticipantPresencesStatusComplete( ctx, types ) ),
        )
    }

    private fetchParticipantPresencesStatusComplete (
        ctx: StateContext<ParticipantStateModel>,
        status: SelectItem<string>[],
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
            payload.pageNumber,
            payload.pageSize,
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

    @Action( InputParticipantsPageTextSearched )
    public inputParticipantsPageTextSearched (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantsPageTextSearched,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: {
                    ...ctx.getState().participants.params,
                    textSearched: payload.textSearched,
                },
            },
        } )
    }

    @Action( SelectParticipantsPageStatusSearched )
    public selectParticipantsPageStatusSearched (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantsPageStatusSearched,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: {
                    ...ctx.getState().participants.params,
                    statusSearched: payload.statusSearched,
                },
            },
        } )
    }

    @Action( SelectParticipantsPageVisibilitySearched )
    public selectParticipantsPageVisibility (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantsPageVisibilitySearched,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: {
                    ...ctx.getState().participants.params,
                    visibilitySearched: payload.visibilitySearched,
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

    @Action( FetchParticipantMovementsPage )
    public fetchParticipantMovementsPage (
        ctx: StateContext<ParticipantStateModel>,
        payload: FetchParticipantMovementsPage,
    ): Observable<void> {
        return this.service.findParticipantMovements(
            payload.eventId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startParticipantMovementsPageLoader() ),
            finalize( (): void => this.facade.stopParticipantMovementsPageLoader() ),
            map( (movementsPage: PageModel<MovementModel>): void => this.fetchParticipantMovementsPageComplete(
                ctx,
                payload.eventId,
                movementsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.movementsPageError( ctx, error ) ),
        )
    }

    private fetchParticipantMovementsPageComplete (
        ctx: StateContext<ParticipantStateModel>,
        eventId: string | undefined,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                element: movementsPage,
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchParticipantMovementsContent(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
                eventId,
            )
        }
    }

    @Action( FetchParticipantMovementsContents )
    public fetchParticipantMovementsContents (
        ctx: StateContext<ParticipantStateModel>,
        payload: FetchParticipantMovementsContents,
    ): Observable<void> {
        return this.movementService.findMovementsContent(
            payload.eventId,
            payload.movementIds,
        ).pipe(
            map( (contents: PairModel<MovementContentModel[]>[]): void => this.fetchParticipantMovementsContentsComplete(
                ctx,
                contents,
            ) ),
        )
    }

    private fetchParticipantMovementsContentsComplete (
        ctx: StateContext<ParticipantStateModel>,
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

    @Action( SelectParticipantMovementsPageTypeSearched )
    public selectParticipantMovementsPageTypeSearched (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantMovementsPageTypeSearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    typeSearched: payload.typeSearched,
                },
            },
        } )
    }

    @Action( InputParticipantMovementsPageStartDateTimeSearched )
    public inputParticipantMovementsPageStartDateTimeSearched (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantMovementsPageStartDateTimeSearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    startDateTimeSearched: payload.startDateTimeSearched?.toISOString(),
                },
            },
        } )
    }

    @Action( InputParticipantMovementsPageEndDateTimeSearched )
    public inputParticipantMovementsPageEndDateTimeSearched (
        ctx: StateContext<ParticipantStateModel>,
        payload: InputParticipantMovementsPageEndDateTimeSearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    endDateTimeSearched: payload.endDateTimeSearched?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectParticipantMovementsPageVisibilitySearched )
    public selectParticipantMovementsPageVisibilitySearched (
        ctx: StateContext<ParticipantStateModel>,
        payload: SelectParticipantMovementsPageVisibilitySearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    visibilitySearched: payload.visibilitySearched,
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
            payload.textSearched,
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
            payload.textSearched,
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
            'participants.notifications.create.title',
            'participants.notifications.create.message',
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
            'participants.notifications.edit.title',
            'participants.notifications.edit.message',
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
            'participants.notifications.disable.title',
            'participants.notifications.disable.message',
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
            'participants.notifications.enable.title',
            'participants.notifications.enable.message',
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
            'participants.notifications.delete.title',
            'participants.notifications.delete.message',
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
        this.facade.fetchParticipantsPage( page?.pageNumber, page?.pageSize, true, eventId )
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
