import { inject } from '@angular/core'
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { ParticipantStoreModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-store.model'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { GroupHelper } from '@shared/helpers/group.helper'
import { refreshOnLanguageChange } from '@shared/helpers/store/language-refresh'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import {
    contentsRequester,
    metadataFetcher,
    movementContentsFetcher,
    pageFetcher,
    paramsUpdater,
    withEmptyOption,
} from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { UserHelper } from '@shared/helpers/user.helper'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { UserModel } from '@shared/models/model/user.model'
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper'

interface ParticipantsPageRequest extends CumulativePageRequest {
    projectId: string | undefined
}

interface ParticipantMovementsPageRequest extends ParticipantsPageRequest {
    id: string
}

interface SearchRequest {
    projectId: string | undefined
    q: string | undefined
}

const defaultParticipantStore: ParticipantStoreModel = {
    sectionErrors: {},
    participants: PageStateHelper.initial<ParticipantPageParamsModel, ParticipantModel>( {
        resetSearch: false,
        q: undefined,
        isVisible: undefined,
        status: undefined,
    } ),
    movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        isCurrent: false,
        isVisible: undefined,
        hasActivity: undefined,
        type: undefined,
        from: undefined,
        to: undefined,
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
    withMethods( (store, api = inject( ParticipantApi ), errors = inject( ErrorReporter ), metadataApi = inject( MetadataApi )) => ({
        fetchPresencesStatus: metadataFetcher<ParticipantStoreModel, 'presencesStatus', void, SelectOptionModel<PresenceStatusEnum>[]>(
            store, 'presencesStatus', () => metadataApi.getPresencesStatus(), withEmptyOption,
        ),
        searchUsers: metadataFetcher<ParticipantStoreModel, 'searchedUsers', SearchRequest, UserModel[]>(
            store, 'searchedUsers', (request: SearchRequest) => api.searchUsers( request.projectId, request.q ),
            (users: UserModel[]): SelectOptionModel<UserModel>[] => users.map( UserHelper.toSelectItem ),
        ),
        searchGroups: metadataFetcher<ParticipantStoreModel, 'searchedGroups', SearchRequest, GroupModel[]>(
            store, 'searchedGroups', (request: SearchRequest) => api.searchGroups( request.projectId, request.q ),
            (groups: GroupModel[]): SelectOptionModel<GroupModel>[] => groups.map( GroupHelper.toSelectItem ),
        ),
        fetchParticipantsPage: pageFetcher( store, 'participants', (request: ParticipantsPageRequest, params: ParticipantPageParamsModel) =>
            api.findParticipants( request.projectId, request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge } ),
        updateParticipantsPageSearchParams: paramsUpdater( store, 'participants' ),
    }) ),
    withMethods( (store, movementApi = inject( MovementApi )) => ({
        updateParticipantMovementsPageSearchParams: paramsUpdater( store, 'movements' ),
        fetchParticipantMovementsContents: movementContentsFetcher( store, movementApi ),
    }) ),
    withMethods( (store, api = inject( ParticipantApi ), errors = inject( ErrorReporter )) => ({
        fetchParticipantMovementsPage: pageFetcher( store, 'movements', (request: ParticipantMovementsPageRequest, params: MovementPageParamsModel) =>
            api.findParticipantMovements( request.projectId, request.id, request.page, request.size, params ), errors, {
            merge: CumulativePageHelper.merge,
            after: contentsRequester( store.fetchParticipantMovementsContents ),
        } ),
    }) ),
    withHooks( {
        onInit: (store): void => refreshOnLanguageChange( store.fetchPresencesStatus ),
    } ),
)
