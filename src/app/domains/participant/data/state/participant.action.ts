import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantDto } from '../dto/participant.dto'
import { ParticipantPageParamsModel } from '../model/participant-page-params.model'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'

export enum ParticipantActionEnum {
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

    START_PARTICIPANT_LOADER = '[Local] Starting participant\'s loader',
    STOP_PARTICIPANT_LOADER = '[Local] Stopping participant\'s loader',

    FETCH_PARTICIPANT = '[Backend] Fetching participant',
    SEARCH_USERS = '[Backend] Searching users to link to participant',
    SEARCH_GROUPS = '[Backend] Searching groups to add participant in it',
    RESET_PARTICIPANT = '[Local] Resetting participant',
    CREATE_PARTICIPANT = '[Backend] Creating participant',
    UPDATE_PARTICIPANT = '[Backend] Updating participant',
    DISABLE_PARTICIPANT = '[Backend] Disabling participant',
    ENABLE_PARTICIPANT = '[Backend] Enabling participant',
    DELETE_PARTICIPANT = '[Backend] Deleting participant',
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
        public readonly eventId: string | undefined,
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
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchParticipantMovementsContents {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT_MOVEMENTS_CONTENT

    public constructor (
        public readonly eventId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class UpdateParticipantMovementsPageSearchParams {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.UPDATE_PARTICIPANT_MOVEMENTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: MovementPageParamsModel) {}
}

export class StartParticipantLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.START_PARTICIPANT_LOADER
}

export class StopParticipantLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.STOP_PARTICIPANT_LOADER
}

export class FetchParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class SearchUsers {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SEARCH_USERS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}

export class SearchGroups {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SEARCH_GROUPS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}

export class ResetParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.RESET_PARTICIPANT
}

export class CreateParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.CREATE_PARTICIPANT

    public constructor (public readonly eventId: string | undefined, public readonly participant: ParticipantDto) {}
}

export class UpdateParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.UPDATE_PARTICIPANT

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly participant: ParticipantDto,
    ) {}
}

export class DisableParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.DISABLE_PARTICIPANT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class EnableParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.ENABLE_PARTICIPANT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class DeleteParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.DELETE_PARTICIPANT

    public constructor (public readonly eventId: string | undefined, public readonly participant: ParticipantModel) {}
}
