import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantDto } from '../dto/participant.dto'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

export enum ParticipantActionEnum {
    START_PARTICIPANTS_PAGE_LOADER = '[Local] Starting participants\' page loader',
    STOP_PARTICIPANTS_PAGE_LOADER = '[Local] Stopping participants\' page loader',

    FETCH_PARTICIPANTS_PAGE = '[Backend] Fetching participants\' page',
    INPUT_PARTICIPANTS_PAGE_SEARCH = '[Local] Inputting participants\' page search',
    INPUT_PARTICIPANTS_PAGE_DATE_RANGE = '[Local] Inputting participants\' page date range',
    SELECT_PARTICIPANTS_PAGE_VISIBILITY = '[Local] Selecting participants\' page visibility',
    SELECT_PARTICIPANTS_PAGE_ORDER = '[Local] Selecting participants\' page order',

    START_PARTICIPANT_MOVEMENTS_PAGE_LOADER = '[Local] Starting participant movements\' page loader',
    STOP_PARTICIPANT_MOVEMENTS_PAGE_LOADER = '[Local] Stopping participant movements\' page loader',

    FETCH_PARTICIPANT_MOVEMENT_TYPES = '[Backend] Fetching participant movement types',

    FETCH_PARTICIPANT_MOVEMENTS_PAGE = '[Backend] Fetching participant movements\' page',
    INPUT_PARTICIPANT_MOVEMENTS_PAGE_SEARCH = '[Local] Inputting participant movements\' page search',
    INPUT_PARTICIPANT_MOVEMENTS_PAGE_TYPE = '[Local] Inputting participant movements\' page type',
    INPUT_PARTICIPANT_MOVEMENTS_PAGE_DATE_RANGE = '[Local] Inputting participant movements\' page date range',
    SELECT_PARTICIPANT_MOVEMENTS_PAGE_VISIBILITY = '[Local] Selecting participant movements\' page visibility',
    SELECT_PARTICIPANT_MOVEMENTS_PAGE_ORDER = '[Local] Selecting participant movements\' page order',

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
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputParticipantsPageSearch {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANTS_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputParticipantsPageDateRange {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANTS_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectParticipantsPageVisibility {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANTS_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectParticipantsPageOrder {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANTS_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class StartParticipantMovementsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.START_PARTICIPANT_MOVEMENTS_PAGE_LOADER
}

export class StopParticipantMovementsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.STOP_PARTICIPANT_MOVEMENTS_PAGE_LOADER
}

export class FetchParticipantMovementTypes {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT_MOVEMENT_TYPES

    public constructor (public readonly eventId: string | undefined) {}
}

export class FetchParticipantMovementsPage {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT_MOVEMENTS_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputParticipantMovementsPageSearch {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_MOVEMENTS_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class SelectParticipantMovementsPageType {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_MOVEMENTS_PAGE_TYPE

    public constructor (public readonly type: string | undefined) {}
}

export class InputParticipantMovementsPageDateRange {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_MOVEMENTS_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectParticipantMovementsPageVisibility {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANT_MOVEMENTS_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectParticipantMovementsPageOrder {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANT_MOVEMENTS_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
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
        public readonly searched: string | undefined,
    ) {}
}

export class SearchGroups {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SEARCH_GROUPS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly searched: string | undefined,
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
