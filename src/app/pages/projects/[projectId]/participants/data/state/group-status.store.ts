import { inject } from '@angular/core'
import { signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { GroupStatusPageParamsModel, GroupStatusStoreModel } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model'
import { GroupStatusApi } from '@pages/projects/[projectId]/participants/data/state/group-status.api'
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageFetcher } from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { GroupModel } from '@shared/models/model/group.model'

interface GroupStatusPageRequest extends CumulativePageRequest {
    projectId: string | undefined
}

const defaultGroupStatusStore: GroupStatusStoreModel = {
    mine: PageStateHelper.initial<GroupStatusPageParamsModel, GroupModel>( { resetSearch: false } ),
    groups: PageStateHelper.initial<GroupStatusPageParamsModel, GroupModel>( { resetSearch: false } ),
}

/**
 * Purpose: Holds the group status state.
 * Scope: Owns the pages of my groups and of all the groups, with their members and their loading and error flags, and fetches them through the group status api.
 * Limits: Reached through the group status facade; it does not format data or notify the user of command results.
 */
export const GroupStatusStore = signalStore(
    withState<GroupStatusStoreModel>( defaultGroupStatusStore ),
    withProfileScope<GroupStatusStoreModel>( defaultGroupStatusStore ),
    withMethods( (store, api = inject( GroupStatusApi ), errors = inject( ErrorReporter )) => ({
        fetchMyGroupsPage: pageFetcher( store, 'mine', (request: GroupStatusPageRequest) =>
            api.findMyGroups( request.projectId, request.page, request.size ), errors, { merge: CumulativePageHelper.merge } ),
        fetchGroupsPage: pageFetcher( store, 'groups', (request: GroupStatusPageRequest) =>
            api.findGroups( request.projectId, request.page, request.size ), errors, { merge: CumulativePageHelper.merge } ),
    }) ),
)
