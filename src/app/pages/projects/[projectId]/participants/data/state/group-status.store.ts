import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { groupBy, mergeMap, Observable, pipe, switchMap, tap } from 'rxjs'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { GroupMembersBlock, GroupStatusPageParamsModel, GroupStatusStoreModel } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model'
import { GroupStatusApi } from '@pages/projects/[projectId]/participants/data/state/group-status.api'
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageFetcher } from '@shared/helpers/store/paged-store.methods'
import { PageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { GroupModel } from '@shared/models/model/group.model'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

interface GroupStatusPageRequest extends CumulativePageRequest {
    projectId: string | undefined
}

export interface GroupMembersRequest extends GroupStatusPageRequest {
    groupId: string
}

const defaultGroupStatusStore: GroupStatusStoreModel = {
    mine: PageStateHelper.initial<GroupStatusPageParamsModel, GroupModel>( { resetSearch: false } ),
    groups: PageStateHelper.initial<GroupStatusPageParamsModel, GroupModel>( { resetSearch: false } ),
    members: {},
}

/**
 * Purpose: Holds the group status state.
 * Scope: Owns the pages of my groups and of all the groups, with their presence counters, and the pages of on-site members of the groups that were opened, each with its loading and error flags, and fetches them through the group status api.
 * Limits: Reached through the group status facade; it does not format data or notify the user of command results. The members of a group are fetched on demand only.
 */
export const GroupStatusStore = signalStore(
    withState<GroupStatusStoreModel>( defaultGroupStatusStore ),
    withProfileScope<GroupStatusStoreModel>( defaultGroupStatusStore ),
    withMethods( (store, api = inject( GroupStatusApi ), errors = inject( ErrorReporter )) => {
        const membersSlice = (groupId: string): PageSlice<GroupMembersBlock> => ({
            read: (): GroupMembersBlock => store.members()[ groupId ]
                ?? PageStateHelper.initial<GroupStatusPageParamsModel, ParticipantModel>( { resetSearch: false } ),
            write: (block: GroupMembersBlock): void => patchState( store, (state) => ({ members: { ...state.members, [ groupId ]: block } }) ),
        })

        const storeMembers = (request: GroupMembersRequest, fetched: PageModel<ParticipantModel>): void => {
            const slice: PageSlice<GroupMembersBlock> = membersSlice( request.groupId )
            const block: GroupMembersBlock = slice.read()
            slice.write( { ...block, element: CumulativePageHelper.merge( block.element, fetched, request ) } )
        }

        return {
            fetchMyGroupsPage: pageFetcher( store, 'mine', (request: GroupStatusPageRequest) =>
                api.findMyGroups( request.projectId, request.page, request.size ), errors, { merge: CumulativePageHelper.merge } ),
            fetchGroupsPage: pageFetcher( store, 'groups', (request: GroupStatusPageRequest) =>
                api.findGroups( request.projectId, request.page, request.size ), errors, { merge: CumulativePageHelper.merge } ),
            fetchGroupMembersPage: rxMethod<GroupMembersRequest>( pipe(
                groupBy( (request: GroupMembersRequest): string => request.groupId ),
                mergeMap( (requests: Observable<GroupMembersRequest>): Observable<PageModel<ParticipantModel>> => requests.pipe(
                    switchMap( (request: GroupMembersRequest): Observable<PageModel<ParticipantModel>> =>
                        api.findOnSiteMembers( request.projectId, request.groupId, request.page, request.size ).pipe(
                            trackPage( membersSlice( request.groupId ) ),
                            tap( (fetched: PageModel<ParticipantModel>): void => storeMembers( request, fetched ) ),
                        ) ),
                ) ),
            ) ),
        }
    } ),
)
