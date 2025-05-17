import { CommunicationPageParamsModel } from '../model/communication-page-params.model'
import { CommunicationDto } from '../dto/communication.dto'
import { CommunicationModel } from '../model/communication.model'

enum CommunicationAction {
    RESET_COMMUNICATION_STATE = '[Local] Resetting communication state',

    START_COMMUNICATIONS_PAGE_LOADER = '[Local] Starting communications\' page loader',
    STOP_COMMUNICATIONS_PAGE_LOADER = '[Local] Stopping communications\' page loader',

    FETCH_COMMUNICATIONS_PAGE = '[Backend] Fetching communications\' page',
    UPDATE_COMMUNICATIONS_PAGE_SEARCH_PARAMS = '[Local] Updating communications\' page search params',

    START_COMMUNICATION_LOADER = '[Local] Starting communication loader',
    STOP_COMMUNICATION_LOADER = '[Local] Stopping communication loader',

    SEARCH_MOVEMENTS = '[Backend] Searching movements to link communication',
    FETCH_COMMUNICATION = '[Backend] Fetching communication',
    RESET_COMMUNICATION = '[Local] Resetting communication',
    CREATE_COMMUNICATION = '[Backend] Creating communication',
    UPDATE_COMMUNICATION = '[Backend] Updating communication',
    DISABLE_COMMUNICATION = '[Backend] Disabling communication',
    ENABLE_COMMUNICATION = '[Backend] Enabling communication',
    DELETE_COMMUNICATION = '[Backend] Deleting communication',
}

export class ResetCommunicationState {
    public static readonly type: CommunicationAction = CommunicationAction.RESET_COMMUNICATION_STATE
}

export class StartCommunicationsPageLoader {
    public static readonly type: CommunicationAction = CommunicationAction.START_COMMUNICATIONS_PAGE_LOADER
}

export class StopCommunicationsPageLoader {
    public static readonly type: CommunicationAction = CommunicationAction.STOP_COMMUNICATIONS_PAGE_LOADER
}

export class FetchCommunicationsPage {
    public static readonly type: CommunicationAction = CommunicationAction.FETCH_COMMUNICATIONS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateCommunicationsPageSearchParams {
    public static readonly type: CommunicationAction = CommunicationAction.UPDATE_COMMUNICATIONS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: CommunicationPageParamsModel) {}
}

export class StartCommunicationLoader {
    public static readonly type: CommunicationAction = CommunicationAction.START_COMMUNICATION_LOADER
}

export class StopCommunicationLoader {
    public static readonly type: CommunicationAction = CommunicationAction.STOP_COMMUNICATION_LOADER
}

export class FetchCommunication {
    public static readonly type: CommunicationAction = CommunicationAction.FETCH_COMMUNICATION

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class SearchMovements {
    public static readonly type: CommunicationAction = CommunicationAction.SEARCH_MOVEMENTS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}

export class ResetCommunication {
    public static readonly type: CommunicationAction = CommunicationAction.RESET_COMMUNICATION
}

export class CreateCommunication {
    public static readonly type: CommunicationAction = CommunicationAction.CREATE_COMMUNICATION

    public constructor (
        public readonly projectId: string | undefined,
        public readonly communication: CommunicationDto,
    ) {}
}

export class UpdateCommunication {
    public static readonly type: CommunicationAction = CommunicationAction.UPDATE_COMMUNICATION

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly communication: CommunicationDto,
    ) {}
}

export class DisableCommunication {
    public static readonly type: CommunicationAction = CommunicationAction.DISABLE_COMMUNICATION

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class EnableCommunication {
    public static readonly type: CommunicationAction = CommunicationAction.ENABLE_COMMUNICATION

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class DeleteCommunication {
    public static readonly type: CommunicationAction = CommunicationAction.DELETE_COMMUNICATION

    public constructor (
        public readonly projectId: string | undefined,
        public readonly communication: CommunicationModel,
    ) {}
}
