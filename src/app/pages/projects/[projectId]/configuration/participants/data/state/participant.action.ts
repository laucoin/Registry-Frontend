import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'

enum ParticipantActionEnum {
    RESET_PARTICIPANT_STATE = '[Local] Resetting participant state',

    FETCH_PARTICIPANT_PRESENCES_STATUS = '[Backend] Fetching participant presences status',

    START_PARTICIPANTS_PAGE_LOADER = '[Local] Starting participants\' page loader',
    STOP_PARTICIPANTS_PAGE_LOADER = '[Local] Stopping participants\' page loader',

    FETCH_PARTICIPANTS_PAGE = '[Backend] Fetching participants\' page',
    UPDATE_PARTICIPANTS_PAGE_SEARCH_PARAMS = '[Local] Updating participants\' page search params',

    START_PARTICIPANT_MOVEMENTS_PAGE_LOADER = '[Local] Starting participant movements\' page loader',
    STOP_PARTICIPANT_MOVEMENTS_PAGE_LOADER = '[Local] Stopping participant movements\' page loader',

    FETCH_PARTICIPANT_MOVEMENTS_PAGE = '[Backend] Fetching participant movements\' page',
    FETCH_PARTICIPANT_MOVEMENTS_CONTENT = '[Backend] Fetching participant movements\' content',
    UPDATE_PARTICIPANT_MOVEMENTS_PAGE_SEARCH_PARAMS = '[Local] Updating participant movements\' page search params',


    SEARCH_USERS = '[Backend] Searching users to link to participant',
    SEARCH_GROUPS = '[Backend] Searching groups to add participant in it',
}

export class ResetParticipantState {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.RESET_PARTICIPANT_STATE
}

export class FetchParticipantPresencesStatus {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT_PRESENCES_STATUS
}

export class StartParticipantsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.START_PARTICIPANTS_PAGE_LOADER
}

export class StopParticipantsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.STOP_PARTICIPANTS_PAGE_LOADER
}

export class FetchParticipantsPage {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANTS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateParticipantsPageSearchParams {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.UPDATE_PARTICIPANTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: ParticipantPageParamsModel) {}
}

export class StartParticipantMovementsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.START_PARTICIPANT_MOVEMENTS_PAGE_LOADER
}

export class StopParticipantMovementsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.STOP_PARTICIPANT_MOVEMENTS_PAGE_LOADER
}

export class FetchParticipantMovementsPage {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT_MOVEMENTS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchParticipantMovementsContents {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT_MOVEMENTS_CONTENT

    public constructor (
        public readonly projectId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class UpdateParticipantMovementsPageSearchParams {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.UPDATE_PARTICIPANT_MOVEMENTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: MovementPageParamsModel) {}
}

export class SearchUsers {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SEARCH_USERS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}

export class SearchGroups {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SEARCH_GROUPS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}
