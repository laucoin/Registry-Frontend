import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GenericProjectElementStore } from '@shared/helpers/state/generic-project-element.store'
import { initialize } from '@shared/helpers/rx.helper'
import { ParticipantStoreModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-store.model'
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
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { inject, Injectable } from '@angular/core'
import { UserHelper } from '@shared/helpers/user.helper'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GroupModel } from '@shared/models/model/group.model'
import { GroupHelper } from '@shared/helpers/group.helper'
import { UserModel } from '@shared/models/model/user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

const defaultParticipantStore: ParticipantStoreModel = {
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

@State<ParticipantStoreModel>( {
    name: 'participant',
    defaults: defaultParticipantStore,
} )
@Injectable()
export class ParticipantStore extends GenericProjectElementStore<ParticipantStoreModel> implements NgxsOnInit {
    private readonly api: ParticipantApi = inject( ParticipantApi )
    private readonly metadataApi: MetadataApi = inject( MetadataApi )
    private readonly movementApi: MovementApi = inject( MovementApi )
    private readonly facade: ParticipantFacade = inject( ParticipantFacade )

    public ngxsOnInit (): void {
        this.facade.fetchPresencesStatus()
    }

    @Selector()
    public static participantsPage (state: ParticipantStoreModel): PageModel<ParticipantModel> | undefined {
        return state.participants.element
    }

    @Selector()
    public static participantsPageLoading (state: ParticipantStoreModel): boolean {
        return state.participants.loading
    }

    @Selector()
    public static participantsPageError (state: ParticipantStoreModel): ToastMessageOptions | undefined {
        return state.participants.error
    }

    @Selector()
    public static participantsPageSilentLoading (state: ParticipantStoreModel): boolean {
        return state.participants.silentLoading
    }

    @Selector()
    public static participantsPageResetSearch (state: ParticipantStoreModel): boolean {
        return state.participants.params.resetSearch
    }

    @Selector()
    public static participantsPageTextSearchedParam (state: ParticipantStoreModel): string | undefined {
        return state.participants.params.textSearched
    }

    @Selector()
    public static participantsPageStatusSearchedParam (state: ParticipantStoreModel): string | undefined {
        return state.participants.params.statusSearched
    }

    @Selector()
    public static participantsPageVisibilitySearchedParam (state: ParticipantStoreModel): boolean | undefined {
        return state.participants.params.visibilitySearched
    }

    @Selector()
    public static participantMovementsPage (state: ParticipantStoreModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static participantMovementsPageLoading (state: ParticipantStoreModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static participantMovementsPageError (state: ParticipantStoreModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static participantMovementsPageSilentLoading (state: ParticipantStoreModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static participantMovementsPageResetSearch (state: ParticipantStoreModel): boolean {
        return state.movements.params.resetSearch
    }

    @Selector()
    public static participantMovementsPageTypeSearchedParam (state: ParticipantStoreModel): string | undefined {
        return state.movements.params.typeSearched
    }

    @Selector()
    public static participantMovementsPageStartDateTimeSearchedParam (state: ParticipantStoreModel): string | undefined {
        return state.movements.params.startDateTimeSearched
    }

    @Selector()
    public static participantMovementsPageEndDateTimeSearchedParam (state: ParticipantStoreModel): string | undefined {
        return state.movements.params.endDateTimeSearched
    }

    @Selector()
    public static participantMovementsPageVisibilitySearchedParam (state: ParticipantStoreModel): boolean | undefined {
        return state.movements.params.visibilitySearched
    }

    @Selector()
    public static searchedUsersMetadata (state: ParticipantStoreModel): SelectItem<UserModel>[] {
        return state._metadata.searchedUsers
    }

    @Selector()
    public static searchedGroupsMetadata (state: ParticipantStoreModel): SelectItem<GroupModel>[] {
        return state._metadata.searchedGroups
    }

    @Selector()
    public static presencesStatusMetadata (state: ParticipantStoreModel): SelectItem<PresenceStatusEnum | undefined>[] {
        return state._metadata.presencesStatus
    }

    @Selector()
    public static visibilitiesMetadata (state: ParticipantStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetParticipantState )
    public resetParticipantState (ctx: StateContext<ParticipantStoreModel>): void {
        ctx.setState( {
            ...defaultParticipantStore,
            _metadata: {
                ...defaultParticipantStore._metadata,
                presencesStatus: ctx.getState()._metadata.presencesStatus,
            },
        } )
    }

    @Action( FetchParticipantPresencesStatus )
    public fetchParticipantPresencesStatus (ctx: StateContext<ParticipantStoreModel>): Observable<void> {
        return this.metadataApi.getPresencesStatus().pipe(
            map( (types: SelectItem<PresenceStatusEnum>[]): void => this.fetchParticipantPresencesStatusComplete(
                ctx,
                types,
            ) ),
        )
    }

    private fetchParticipantPresencesStatusComplete (
        ctx: StateContext<ParticipantStoreModel>,
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
    public startParticipantsPageLoader (ctx: StateContext<ParticipantStoreModel>): void {
        ctx.patchState( {
            participants: StateHelper.updatePageLoader( ctx.getState().participants, true ),
        } )
    }

    @Action( StopParticipantsPageLoader )
    public stopParticipantsPageLoader (ctx: StateContext<ParticipantStoreModel>): void {
        ctx.patchState( {
            participants: StateHelper.updatePageLoader( ctx.getState().participants, false ),
        } )
    }

    @Action( FetchParticipantsPage )
    public fetchParticipantsPage (
        ctx: StateContext<ParticipantStoreModel>,
        payload: FetchParticipantsPage,
    ): Observable<void> {
        return this.api.findParticipants(
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
        ctx: StateContext<ParticipantStoreModel>,
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
        ctx: StateContext<ParticipantStoreModel>,
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
    public startParticipantMovementsPageLoader (ctx: StateContext<ParticipantStoreModel>): void {
        ctx.patchState( {
            movements: StateHelper.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopParticipantMovementsPageLoader )
    public stopParticipantMovementsPageLoader (ctx: StateContext<ParticipantStoreModel>): void {
        ctx.patchState( {
            movements: StateHelper.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchParticipantMovementsPage )
    public fetchParticipantMovementsPage (
        ctx: StateContext<ParticipantStoreModel>,
        payload: FetchParticipantMovementsPage,
    ): Observable<void> {
        return this.api.findParticipantMovements(
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
        ctx: StateContext<ParticipantStoreModel>,
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
        ctx: StateContext<ParticipantStoreModel>,
        payload: FetchParticipantMovementsContents,
    ): Observable<void> {
        return this.movementApi.findMovementsContents(
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
        ctx: StateContext<ParticipantStoreModel>,
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

    @Action( UpdateParticipantMovementsPageSearchParams )
    public updateParticipantMovementsPageSearchParams (
        ctx: StateContext<ParticipantStoreModel>,
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
        ctx: StateContext<ParticipantStoreModel>,
        payload: SearchUsers,
    ): Observable<void> {
        return this.api.searchUsers(
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
        ctx: StateContext<ParticipantStoreModel>,
        users: UserModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedUsers: users.map( (user: UserModel): SelectItem<UserModel> => UserHelper.toSelectItem( user ) ),
            },
        } )
    }

    @Action( SearchGroups )
    public searchGroups (
        ctx: StateContext<ParticipantStoreModel>,
        payload: SearchGroups,
    ): Observable<void> {
        return this.api.searchGroups(
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
        ctx: StateContext<ParticipantStoreModel>,
        groups: GroupModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedGroups: groups.map( (group: GroupModel): SelectItem<GroupModel> => GroupHelper.toSelectItem( group ) ),
            },
        } )
    }

    protected refreshPage (ctx: StateContext<ParticipantStoreModel>): void {
        const page: PageModel<ParticipantModel> | undefined = ctx.getState().participants.element
        this.facade.fetchParticipantsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<ParticipantStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                participants: this.buildErrorMessage( ctx.getState().participants, error ),
            } )
        }

        return of()
    }

    protected movementsPageError (ctx: StateContext<ParticipantStoreModel>, error: ErrorModel): Observable<void> {
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
