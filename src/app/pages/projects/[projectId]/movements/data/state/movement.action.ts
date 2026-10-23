import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'

enum MovementActionEnum {
    RESET_MOVEMENT_STATE = '[Local] Resetting movement state',

    FETCH_MOVEMENT_TYPES = '[Backend] Fetching movement types',
    FETCH_PARTICIPANT_TYPES = '[Backend] Fetching participant types',

    START_MOVEMENTS_PAGE_LOADER = '[Local] Starting movements\' page loader',
    STOP_MOVEMENTS_PAGE_LOADER = '[Local] Stopping movements\' page loader',

    FETCH_MOVEMENTS_PAGE = '[Backend] Fetching movements\' page',
    FETCH_MOVEMENTS_CONTENT = '[Backend] Fetching movements\' content',
    UPDATE_MOVEMENTS_PAGE_SEARCH_PARAMS = '[Local] Updating movements\' page search params',

    START_MOVEMENT_COMMUNICATIONS_PAGE_LOADER = '[Local] Starting movement communications\' page loader',
    STOP_MOVEMENT_COMMUNICATIONS_PAGE_LOADER = '[Local] Stopping movement communications\' page loader',

    FETCH_MOVEMENT_COMMUNICATIONS_PAGE = '[Backend] Fetching movement communications\' page',
    UPDATE_MOVEMENT_COMMUNICATIONS_PAGE_SEARCH_PARAMS = '[Local] Updating movement communications\' page search params',


    SEARCH_REASONS_AND_ACTIVITIES = '[Backend] Searching reasons and activities to add in a movement',
    SEARCH_PARTICIPANTS_AND_GROUPS = '[Backend] Searching participants and groups to add in a movement',
    SEARCH_VEHICLES = '[Backend] Searching vehicles to add in a movement',
}

export class ResetMovementState {
    public static readonly type: MovementActionEnum = MovementActionEnum.RESET_MOVEMENT_STATE
}

export class FetchMovementTypes {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENT_TYPES
}

export class FetchParticipantTypes {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_PARTICIPANT_TYPES
}

export class StartMovementsPageLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.START_MOVEMENTS_PAGE_LOADER
}

export class StopMovementsPageLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.STOP_MOVEMENTS_PAGE_LOADER
}

export class FetchMovementsPage {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENTS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchMovementsContent {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENTS_CONTENT

    public constructor (
        public readonly projectId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class UpdateMovementsPageSearchParams {
    public static readonly type: MovementActionEnum = MovementActionEnum.UPDATE_MOVEMENTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: MovementPageParamsModel) {}
}

export class StartMovementCommunicationsPageLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.START_MOVEMENT_COMMUNICATIONS_PAGE_LOADER
}

export class StopMovementCommunicationsPageLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.STOP_MOVEMENT_COMMUNICATIONS_PAGE_LOADER
}

export class FetchMovementCommunicationsPage {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENT_COMMUNICATIONS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateMovementCommunicationsPageSearchParams {
    public static readonly type: MovementActionEnum = MovementActionEnum.UPDATE_MOVEMENT_COMMUNICATIONS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: CommunicationPageParamsModel) {}
}

export class SearchReasonsAndActivities {
    public static readonly type: MovementActionEnum = MovementActionEnum.SEARCH_REASONS_AND_ACTIVITIES

    public constructor (
        public readonly projectId: string | undefined,
        public readonly textSearched: string | undefined,
        public readonly typeSearched: string,
        public readonly contentTypeSearched: ParticipantTypeEnum,
    ) {}
}

export class SearchParticipantsAndGroups {
    public static readonly type: MovementActionEnum = MovementActionEnum.SEARCH_PARTICIPANTS_AND_GROUPS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly contentTypeSearched: ParticipantTypeEnum,
        public readonly textSearched: string | undefined,
    ) {}
}

export class SearchVehicles {
    public static readonly type: MovementActionEnum = MovementActionEnum.SEARCH_VEHICLES

    public constructor (
        public readonly projectId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}
