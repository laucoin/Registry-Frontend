import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantDto } from '../dto/participant.dto'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

export enum ParticipantActionEnum {
    START_PARTICIPANTS_PAGE_LOADER = '[Local] Starting participant\'s page loader',
    STOP_PARTICIPANTS_PAGE_LOADER = '[Local] Stopping participant\'s page loader',

    START_PARTICIPANT_LOADER = '[Local] Starting participant\'s loader',
    STOP_PARTICIPANT_LOADER = '[Local] Stopping participant\'s loader',

    FETCH_PARTICIPANT_PAGE = '[Backend] Fetching participant page',
    INPUT_PARTICIPANT_PAGE_SEARCH = '[Local] Inputting participant page search',
    INPUT_PARTICIPANT_PAGE_DATE_RANGE = '[Local] Inputting participant page date range',
    SELECT_PARTICIPANT_PAGE_VISIBILITY = '[Local] Selecting participant page visibility',
    SELECT_PARTICIPANT_PAGE_ORDER = '[Local] Selecting participant page order',

    FETCH_PARTICIPANT = '[Backend] Fetching participant',
    SEARCH_PARTICIPANT = '[Backend] Searching participant',
    CREATE_PARTICIPANT = '[Backend] Creating participant',
    UPDATE_PARTICIPANT = '[Backend] Updating participant',
    DISABLE_PARTICIPANT = '[Backend] Disabling participant',
    ENABLE_PARTICIPANT = '[Backend] Enabling participant',
    DELETE_PARTICIPANT = '[Backend] Deleting participant',

    RESET_PARTICIPANT = '[Local] Resetting participant',
}

export class StartParticipantsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.START_PARTICIPANTS_PAGE_LOADER
}

export class StopParticipantsPageLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.STOP_PARTICIPANTS_PAGE_LOADER
}

export class StartParticipantLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.START_PARTICIPANT_LOADER
}

export class StopParticipantLoader {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.STOP_PARTICIPANT_LOADER
}

export class FetchParticipantPage {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputParticipantPageSearch {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputParticipantPageDateRange {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.INPUT_PARTICIPANT_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectParticipantPageVisibility {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANT_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectParticipantPageOrder {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SELECT_PARTICIPANT_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class FetchParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.FETCH_PARTICIPANT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class SearchParticipant {
    public static readonly type: ParticipantActionEnum = ParticipantActionEnum.SEARCH_PARTICIPANT

    public constructor (
        public readonly eventId: string | undefined,
        public readonly onlyPresent: boolean,
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
