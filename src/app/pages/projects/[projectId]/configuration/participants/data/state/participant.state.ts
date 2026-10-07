import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GenericProjectElementState } from '@shared/helpers/state/generic-project-element.state'
import { initialize } from '@shared/helpers/util/rx.util'
import { ParticipantStateModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-state.model'
import {
    FetchParticipantMovementsContents,
    FetchParticipantMovementsPage,
    FetchParticipantPresencesStatus,
    FetchParticipantsPage,
    ResetParticipantState,
    SearchGroups,
    SearchUsers,
    StartParticipantMovementsPageLoader,
    StartParticipantsPageLoader,
    StopParticipantMovementsPageLoader,
    StopParticipantsPageLoader,
    UpdateParticipantMovementsPageSearchParams,
    UpdateParticipantsPageSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/data/state/participant.action'
import { ParticipantService } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.service'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { StateUtil } from '@shared/helpers/state/state.util'
import { inject, Injectable } from '@angular/core'
import { UserUtil } from '@shared/helpers/util/user.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GroupModel } from '@shared/models/model/group.model'
import { GroupUtil } from '@shared/helpers/util/group.util'
import { UserModel } from '@shared/models/model/user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementService } from '@pages/projects/[projectId]/movements/data/state/movement.service'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementUtil } from '@shared/helpers/util/movement.util'
import { MetadataService } from '@core/registry/state/metadata.service'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

const defaultParticipantState: ParticipantStateModel = {
    participants: {
        element: undefined,
        params: {
            resetSearch: false,
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
export class ParticipantState extends GenericProjectElementState<ParticipantStateModel> implements NgxsOnInit {
    private readonly service: ParticipantService = inject( ParticipantService )
    private readonly metadataService: MetadataService = inject( MetadataService )
    private readonly movementService: MovementService = inject( MovementService )
    private readonly facade: ParticipantFacade = inject( ParticipantFacade )

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
    public static participantsPageResetSearch (state: ParticipantStateModel): boolean {
        return state.participants.params.resetSearch
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
    public static participantMovementsPageResetSearch (state: ParticipantStateModel): boolean {
        return state.movements.params.resetSearch
    }

    @Selector()
    public static participantMovementsPageTypeSearchedParam (state: ParticipantStateModel): string | undefined {
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
    public static searchedUsersMetadata (state: ParticipantStateModel): SelectItem<UserModel>[] {
        return state._metadata.searchedUsers
    }

    @Selector()
    public static searchedGroupsMetadata (state: ParticipantStateModel): SelectItem<GroupModel>[] {
        return state._metadata.searchedGroups
    }

    @Selector()
    public static presencesStatusMetadata (state: ParticipantStateModel): SelectItem<PresenceStatusEnum | undefined>[] {
        return state._metadata.presencesStatus
    }

    @Selector()
    public static visibilitiesMetadata (state: ParticipantStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetParticipantState )
    public resetParticipantState (ctx: StateContext<ParticipantStateModel>): void {
        ctx.setState( {
            ...defaultParticipantState,
            _metadata: {
                ...defaultParticipantState._metadata,
                presencesStatus: ctx.getState()._metadata.presencesStatus,
            },
        } )
    }

    @Action( FetchParticipantPresencesStatus )
    public fetchParticipantPresencesStatus (ctx: StateContext<ParticipantStateModel>): Observable<void> {
        return this.metadataService.getPresencesStatus().pipe(
            map( (types: SelectItem<PresenceStatusEnum>[]): void => this.fetchParticipantPresencesStatusComplete(
                ctx,
                types,
            ) ),
        )
    }

    private fetchParticipantPresencesStatusComplete (
        ctx: StateContext<ParticipantStateModel>,
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
            payload.projectId,
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
                params: {
                    ...ctx.getState().participants.params,
                    resetSearch: false,
                },
                element: participantPage,
            },
        } )
    }

    @Action( UpdateParticipantsPageSearchParams )
    public updateParticipantsPageSearchParams (
        ctx: StateContext<ParticipantStateModel>,
        payload: UpdateParticipantsPageSearchParams,
    ): void {
        ctx.patchState( {
            participants: {
                ...ctx.getState().participants,
                params: payload.params,
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
            payload.projectId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
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
                params: {
                    ...ctx.getState().movements.params,
                    resetSearch: false,
                },
                element: movementsPage,
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchParticipantMovementsContent(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
            )
        }
    }

    @Action( FetchParticipantMovementsContents )
    public fetchParticipantMovementsContents (
        ctx: StateContext<ParticipantStateModel>,
        payload: FetchParticipantMovementsContents,
    ): Observable<void> {
        return this.movementService.findMovementsContents(
            payload.projectId,
            payload.movementIds,
            ctx.getState().movements.params.currentMovements,
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

    @Action( UpdateParticipantMovementsPageSearchParams )
    public updateParticipantMovementsPageSearchParams (
        ctx: StateContext<ParticipantStateModel>,
        payload: UpdateParticipantMovementsPageSearchParams,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: payload.params,
            },
        } )
    }

    @Action( SearchUsers )
    public searchUsers (
        ctx: StateContext<ParticipantStateModel>,
        payload: SearchUsers,
    ): Observable<void> {
        return this.service.searchUsers(
            payload.projectId,
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
            payload.projectId,
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

    protected refreshPage (ctx: StateContext<ParticipantStateModel>): void {
        const page: PageModel<ParticipantModel> | undefined = ctx.getState().participants.element
        this.facade.fetchParticipantsPage( page?.pageNumber, page?.pageSize, true )
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
