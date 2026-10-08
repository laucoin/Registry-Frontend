import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {TranslocoService} from '@jsverse/transloco'
import { map, Observable, pipe, skip, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { ParticipantStoreModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-store.model'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserHelper } from '@shared/helpers/user.helper'
import { GroupHelper } from '@shared/helpers/group.helper'
import { UserModel } from '@shared/models/model/user.model'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

interface ParticipantsPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface ParticipantMovementsPageRequest extends ParticipantsPageRequest {
    id: string
}

interface SearchRequest {
    projectId: string | undefined
    textSearched: string | undefined
}

interface ParticipantMovementsContentsRequest {
    projectId: string | undefined
    movementIds: string[]
}

const defaultParticipantStore: ParticipantStoreModel = {
    participants: PageStateHelper.initial<ParticipantPageParamsModel, ParticipantModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
        statusSearched: undefined,
    } ),
    movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        currentMovements: false,
        visibilitySearched: undefined,
        linkedToActivity: undefined,
        typeSearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    metadata: {
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

/**
 * Purpose: Holds the participant state.
 * Scope: Owns the data of the participant pages and resources with their loading and error flags, and fetches them through the participant api.
 * Limits: Reached through the participant facade; it does not format data or notify the user of command results.
 */
export const ParticipantStore = signalStore(
    withState<ParticipantStoreModel>( defaultParticipantStore ),
    withProfileScope<ParticipantStoreModel>( defaultParticipantStore, (current: ParticipantStoreModel): Partial<ParticipantStoreModel> => ({
        metadata: { ...defaultParticipantStore.metadata, presencesStatus: current.metadata.presencesStatus },
    }) ),
    withProps( () => ({
        api: inject( ParticipantApi ),
        movementApi: inject( MovementApi ),
        metadataApi: inject( MetadataApi ),
        uiFacade: inject( UiFacade ),
    }) ),
    withMethods( (store) => {
        const fetchPresencesStatus = rxMethod<void>( pipe(
            switchMap( (): Observable<SelectItem<PresenceStatusEnum>[]> => store.metadataApi.getPresencesStatus().pipe(
                notifyOnError( store.uiFacade ),
            ) ),
            tap( (status: SelectItem<PresenceStatusEnum>[]): void => patchState( store, (state: ParticipantStoreModel) => ({
                metadata: { ...state.metadata, presencesStatus: [ { label: '-', value: undefined }, ...status ] },
            }) ) ),
        ) )

        const fetchMovementsContents = rxMethod<ParticipantMovementsContentsRequest>( pipe(
            switchMap( (request: ParticipantMovementsContentsRequest): Observable<PairModel<MovementContentModel[]>[]> =>
                store.movementApi.findMovementsContents(
                    request.projectId,
                    request.movementIds,
                    store.movements.params.currentMovements(),
                ).pipe( notifyOnError( store.uiFacade ) ),
            ),
            tap( (contents: PairModel<MovementContentModel[]>[]): void => patchState( store, (state: ParticipantStoreModel) => {
                if (!state.movements.element) return state
                return {
                    movements: {
                        ...state.movements,
                        element: {
                            ...state.movements.element,
                            content: MovementHelper.rebuildPageWithContent( state.movements.element.content, contents ),
                        },
                    },
                }
            }) ),
        ) )

        const searchUsers = rxMethod<SearchRequest>( pipe(
            switchMap( (request: SearchRequest): Observable<UserModel[]> => store.api.searchUsers(
                request.projectId,
                request.textSearched,
            ).pipe( notifyOnError( store.uiFacade ) ) ),
            tap( (users: UserModel[]): void => patchState( store, (state: ParticipantStoreModel) => ({
                metadata: {
                    ...state.metadata,
                    searchedUsers: users.map( (user: UserModel): SelectItem<UserModel> => UserHelper.toSelectItem( user ) ),
                },
            }) ) ),
        ) )

        const searchGroups = rxMethod<SearchRequest>( pipe(
            switchMap( (request: SearchRequest): Observable<GroupModel[]> => store.api.searchGroups(
                request.projectId,
                request.textSearched,
            ).pipe( notifyOnError( store.uiFacade ) ) ),
            tap( (groups: GroupModel[]): void => patchState( store, (state: ParticipantStoreModel) => ({
                metadata: {
                    ...state.metadata,
                    searchedGroups: groups.map( (group: GroupModel): SelectItem<GroupModel> => GroupHelper.toSelectItem( group ) ),
                },
            }) ) ),
        ) )

        return {
            fetchPresencesStatus,
            searchUsers,
            searchGroups,

            fetchParticipantsPage: rxMethod<ParticipantsPageRequest>( pipe(
                switchMap( (request: ParticipantsPageRequest): Observable<PageModel<ParticipantModel>> => store.api.findParticipants(
                    request.projectId,
                    request.pageNumber,
                    request.pageSize,
                    store.participants.params(),
                ).pipe(
                    trackPage( store.uiFacade, pageSlice( store, 'participants' ) ),
                ) ),
                tap( (page: PageModel<ParticipantModel>): void => patchState( store, (state: ParticipantStoreModel) => ({
                    participants: {
                        ...state.participants,
                        params: { ...state.participants.params, resetSearch: false },
                        element: page,
                    },
                }) ) ),
            ) ),

            updateParticipantsPageSearchParams: (params: ParticipantPageParamsModel): void => {
                patchState( store, (state: ParticipantStoreModel) => ({ participants: { ...state.participants, params: params } }) )
            },

            fetchParticipantMovementsPage: rxMethod<ParticipantMovementsPageRequest>( pipe(
                switchMap( (request: ParticipantMovementsPageRequest): Observable<{
                    request: ParticipantMovementsPageRequest
                    page: PageModel<MovementModel>
                }> => store.api.findParticipantMovements(
                    request.projectId,
                    request.id,
                    request.pageNumber,
                    request.pageSize,
                    store.movements.params(),
                ).pipe(
                    trackPage( store.uiFacade, pageSlice( store, 'movements' ) ),
                    map( (page: PageModel<MovementModel>) => ({ request, page }) ),
                ) ),
                tap( ({ request, page }): void => {
                    patchState( store, (state: ParticipantStoreModel) => ({
                        movements: {
                            ...state.movements,
                            params: { ...state.movements.params, resetSearch: false },
                            element: page,
                        },
                    }) )
                    if (page.content.length > 0) {
                        fetchMovementsContents( {
                            projectId: request.projectId,
                            movementIds: page.content.map( (movement: MovementModel): string => movement.id ),
                        } )
                    }
                } ),
            ) ),

            fetchParticipantMovementsContents: fetchMovementsContents,

            updateParticipantMovementsPageSearchParams: (params: MovementPageParamsModel): void => {
                patchState( store, (state: ParticipantStoreModel) => ({ movements: { ...state.movements, params: params } }) )
            },
        }
    } ),
    withHooks( {
        onInit (store): void {
            store.fetchPresencesStatus()
            inject( TranslocoService ).langChanges$.pipe( skip( 1 ), takeUntilDestroyed() ).subscribe( (): void => {
                store.fetchPresencesStatus()
            } )
        },
    } ),
)
