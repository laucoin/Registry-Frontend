import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { Observable, pipe, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GroupPageParamsModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model'
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { GroupStoreModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-store.model'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

interface GroupsPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface GroupMembersPageRequest extends GroupsPageRequest {
    id: string
}

interface SearchParticipantsRequest {
    projectId: string | undefined
    textSearched: string | undefined
}

const defaultGroupStore: GroupStoreModel = {
    groups: PageStateHelper.initial<GroupPageParamsModel, GroupModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
        presenceSearched: undefined,
        dateTimeSearched: undefined,
    } ),
    members: {
        ...PageStateHelper.initial<ParticipantPageParamsModel, ParticipantModel>( {
            resetSearch: false,
            visibilitySearched: undefined,
            statusSearched: undefined,
            textSearched: undefined,
        } ),
        groupId: undefined,
    },
    metadata: {
        searched: [],
        availabilities: [
            { label: '-', value: undefined },
            { label: 'groups.available.true', value: true },
            { label: 'groups.available.false', value: false },
        ],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'groups.visible.true', value: true },
            { label: 'groups.visible.false', value: false },
        ],
    },
}

/**
 * Purpose: Holds the group state.
 * Scope: Owns the data of the group pages and resources with their loading and error flags, and fetches them through the group api.
 * Limits: Reached through the group facade; it does not format data or notify the user of command results.
 */
export const GroupStore = signalStore(
    withState<GroupStoreModel>( defaultGroupStore ),
    withProfileScope<GroupStoreModel>( defaultGroupStore ),
    withProps( () => ({
        api: inject( GroupApi ),
        uiFacade: inject( UiFacade ),
    }) ),
    withMethods( (store) => ({
        fetchGroupsPage: rxMethod<GroupsPageRequest>( pipe(
            switchMap( (request: GroupsPageRequest): Observable<PageModel<GroupModel>> => store.api.findGroups(
                request.projectId,
                request.pageNumber,
                request.pageSize,
                store.groups.params(),
            ).pipe(
                trackPage( store.uiFacade, pageSlice( store, 'groups' ) ),
            ) ),
            tap( (page: PageModel<GroupModel>): void => patchState( store, (state: GroupStoreModel) => ({
                groups: {
                    ...state.groups,
                    params: { ...state.groups.params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) ),

        updateGroupsPageSearchParams: (params: GroupPageParamsModel): void => {
            patchState( store, (state: GroupStoreModel) => ({ groups: { ...state.groups, params: params } }) )
        },

        fetchGroupMembersPage: rxMethod<GroupMembersPageRequest>( pipe(
            tap( (request: GroupMembersPageRequest): void => {
                if (store.members.groupId() != request.id) {
                    patchState( store, { members: { ...defaultGroupStore.members, groupId: request.id } } )
                }
            } ),
            switchMap( (request: GroupMembersPageRequest): Observable<PageModel<ParticipantModel>> => store.api.findGroupMembersByGroupId(
                request.projectId,
                request.id,
                request.pageNumber,
                request.pageSize,
                store.members.params(),
            ).pipe(
                trackPage( store.uiFacade, pageSlice( store, 'members' ) ),
            ) ),
            tap( (page: PageModel<ParticipantModel>): void => patchState( store, (state: GroupStoreModel) => ({
                members: {
                    ...state.members,
                    params: { ...state.members.params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) ),

        updateGroupMembersPageSearchParams: (params: ParticipantPageParamsModel): void => {
            patchState( store, (state: GroupStoreModel) => ({ members: { ...state.members, params: params } }) )
        },

        searchParticipants: rxMethod<SearchParticipantsRequest>( pipe(
            switchMap( (request: SearchParticipantsRequest): Observable<ParticipantModel[]> => store.api.searchParticipants(
                request.projectId,
                request.textSearched,
            ).pipe( notifyOnError( store.uiFacade ) ) ),
            tap( (participants: ParticipantModel[]): void => patchState( store, (state: GroupStoreModel) => ({
                metadata: {
                    ...state.metadata,
                    searched: participants.map( (participant: ParticipantModel): SelectItem<ParticipantModel> =>
                        ParticipantHelper.toSelectItem( participant ),
                    ),
                },
            }) ) ),
        ) ),
    }) ),
)
