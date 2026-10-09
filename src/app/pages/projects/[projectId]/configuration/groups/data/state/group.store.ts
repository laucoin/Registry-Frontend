import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop'
import { Observable, pipe, switchMap, tap } from 'rxjs'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { GroupPageParamsModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model'
import { GroupStoreModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-store.model'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ErrorSink, notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageFetcher, paramsUpdater, StoreRef } from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

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

type GroupStoreRef = StoreRef<GroupStoreModel>

const defaultMembers: GroupStoreModel['members'] = {
    ...PageStateHelper.initial<ParticipantPageParamsModel, ParticipantModel>( {
        resetSearch: false,
        visibilitySearched: undefined,
        statusSearched: undefined,
        textSearched: undefined,
    } ),
    groupId: undefined,
}

const defaultGroupStore: GroupStoreModel = {
    groups: PageStateHelper.initial<GroupPageParamsModel, GroupModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
        presenceSearched: undefined,
        dateTimeSearched: undefined,
    } ),
    members: defaultMembers,
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

function fetchGroupMembersPage (store: GroupStoreRef, api: GroupApi, errors: ErrorSink): RxMethod<GroupMembersPageRequest> {
    return pageFetcher(
        store,
        'members',
        (request: GroupMembersPageRequest, params: ParticipantPageParamsModel) =>
            api.findGroupMembersByGroupId( request.projectId, request.id, request.pageNumber, request.pageSize, params ),
        errors,
        { before: (request: GroupMembersPageRequest): void => resetMembersOnGroupChange( store, request.id ) },
    )
}

function resetMembersOnGroupChange (store: GroupStoreRef, groupId: string): void {
    if (store.members.groupId() != groupId) {
        patchState( store, { members: { ...defaultMembers, groupId: groupId } } )
    }
}

function searchParticipants (store: GroupStoreRef, api: GroupApi, errors: ErrorSink): RxMethod<SearchParticipantsRequest> {
    return rxMethod<SearchParticipantsRequest>( pipe(
        switchMap( (request: SearchParticipantsRequest): Observable<ParticipantModel[]> =>
            api.searchParticipants( request.projectId, request.textSearched ).pipe( notifyOnError( errors ) ),
        ),
        tap( (participants: ParticipantModel[]): void => patchState( store, (state: GroupStoreModel) => ({
            metadata: { ...state.metadata, searched: participants.map( ParticipantHelper.toSelectItem ) as SelectOptionModel<ParticipantModel>[] },
        }) ) ),
    ) )
}

/**
 * Purpose: Holds the group state.
 * Scope: Owns the data of the group pages and resources with their loading and error flags, and fetches them through the group api.
 * Limits: Reached through the group facade; it does not format data or notify the user of command results.
 */
export const GroupStore = signalStore(
    withState<GroupStoreModel>( defaultGroupStore ),
    withProfileScope<GroupStoreModel>( defaultGroupStore ),
    withMethods( (store, api = inject( GroupApi ), errors = inject( ErrorReporter )) => ({
        fetchGroupsPage: pageFetcher( store, 'groups', (request: GroupsPageRequest, params: GroupPageParamsModel) =>
            api.findGroups( request.projectId, request.pageNumber, request.pageSize, params ), errors ),
        updateGroupsPageSearchParams: paramsUpdater( store, 'groups' ),
        fetchGroupMembersPage: fetchGroupMembersPage( store, api, errors ),
        updateGroupMembersPageSearchParams: paramsUpdater( store, 'members' ),
        searchParticipants: searchParticipants( store, api, errors ),
    }) ),
)
