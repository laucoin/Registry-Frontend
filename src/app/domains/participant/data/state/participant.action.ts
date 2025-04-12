import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantDto } from '../dto/participant.dto'

export enum ParticipantActionEnum {
    FETCH_PARTICIPANT_PRESENCES_STATUS = '[Backend] Fetching participant presences status',

    START_PARTICIPANTS_PAGE_LOADER = '[Local] Starting participants\' page loader',
    STOP_PARTICIPANTS_PAGE_LOADER = '[Local] Stopping participants\' page loader',

    FETCH_PARTICIPANTS_PAGE = '[Backend] Fetching participants\' page',
    INPUT_PARTICIPANTS_PAGE_TEXT_SEARCH = '[Local] Inputting participants\' page text search',
    SELECT_PARTICIPANTS_PAGE_VISIBILITY_SEARCH = '[Local] Selecting participants\' page visibility search',
    SELECT_PARTICIPANTS_PAGE_STATUS_SEARCH = '[Local] Selecting participants\' page status search',

    START_PARTICIPANT_MOVEMENTS_PAGE_LOADER = '[Local] Starting participant movements\' page loader',
    STOP_PARTICIPANT_MOVEMENTS_PAGE_LOADER = '[Local] Stopping participant movements\' page loader',

    FETCH_PARTICIPANT_MOVEMENTS_PAGE = '[Backend] Fetching participant movements\' page',
    FETCH_PARTICIPANT_MOVEMENTS_CONTENT = '[Backend] Fetching participant movements\' content',
    INPUT_PARTICIPANT_MOVEMENTS_PAGE_TYPE_SEARCH = '[Local] Inputting participant movements\' page type search',
    INPUT_PARTICIPANT_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH = '[Local] Inputting participant movements\' page start date time search',
    INPUT_PARTICIPANT_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH = '[Local] Inputting participant movements\' page end date time search',
    SELECT_PARTICIPANT_MOVEMENTS_PAGE_VISIBILITY_SEARCH = '[Local] Selecting participant movements\' page visibility search',

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

export class InputParticipantsPageTextSearched {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANTS_PAGE_TEXT_SEARCH

    public constructor (public readonly textSearched: string | undefined) {}
}

export class SelectParticipantsPageStatusSearched {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANTS_PAGE_STATUS_SEARCH

    public constructor (public readonly statusSearched: string | undefined) {}
}

export class SelectParticipantsPageVisibilitySearched {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANTS_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
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

export class SelectParticipantMovementsPageTypeSearched {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_MOVEMENTS_PAGE_TYPE_SEARCH

    public constructor (public readonly typeSearched: string | undefined) {}
}

export class InputParticipantMovementsPageStartDateTimeSearched {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH

    public constructor (public readonly startDateTimeSearched: Date | undefined) {}
}

export class InputParticipantMovementsPageEndDateTimeSearched {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH

    public constructor (public readonly endDateTimeSearched: Date | undefined) {}
}

export class SelectParticipantMovementsPageVisibilitySearched {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANT_MOVEMENTS_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
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
