import { MovementDto } from '../dto/movement.dto'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'

export enum MovementActionEnum {
    FETCH_MOVEMENT_TYPES = '[Backend] Fetching available movement types',

    START_MOVEMENTS_PAGE_LOADER = '[Local] Starting movements\' page loader',
    STOP_MOVEMENTS_PAGE_LOADER = '[Local] Stopping movements\' page loader',

    FETCH_MOVEMENTS_PAGE = '[Backend] Fetching movements\' page',
    FETCH_MOVEMENTS_CONTENT = '[Backend] Fetching movements\' content',
    SELECT_MOVEMENTS_PAGE_TYPE_SEARCH = '[Local] Selecting movements\' page type search',
    INPUT_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH = '[Local] Inputting movements\' page start date time search',
    INPUT_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH = '[Local] Inputting movements\' page end date time search',
    SELECT_MOVEMENTS_PAGE_VISIBILITY_SEARCH = '[Local] Selecting movements\' page visibility search',

    START_MOVEMENT_LOADER = '[Local] Starting movement loader',
    STOP_MOVEMENT_LOADER = '[Local] Stopping movement loader',

    FETCH_MOVEMENT = '[Backend] Fetching movement',
    SEARCH_PARTICIPANTS_AND_GROUPS = '[Backend] Searching participants and groups to add in a movement',
    SEARCH_VEHICLES = '[Backend] Searching vehicles to add in a movement',
    RESET_MOVEMENT = '[Local] Resetting movement',
    CREATE_MOVEMENT = '[Backend] Creating movement',
    UPDATE_MOVEMENT = '[Backend] Updating movement',
    DISABLE_MOVEMENT = '[Backend] Disabling movement',
    ENABLE_MOVEMENT = '[Backend] Enabling movement',
    DELETE_MOVEMENT = '[Backend] Deleting movement',
}

export class FetchMovementTypes {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENT_TYPES
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
        public readonly eventId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchMovementsContent {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENTS_CONTENT

    public constructor (
        public readonly eventId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class SelectMovementsPageTypeSearched {
    public static readonly type: MovementActionEnum = MovementActionEnum.SELECT_MOVEMENTS_PAGE_TYPE_SEARCH

    public constructor (public readonly typeSearched: string | undefined) {}
}

export class InputMovementsPageStartDateTimeSearched {
    public static readonly type: MovementActionEnum = MovementActionEnum.INPUT_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH

    public constructor (public readonly startDateTimeSearched: Date | undefined) {}
}

export class InputMovementsPageEndDateTimeSearched {
    public static readonly type: MovementActionEnum = MovementActionEnum.INPUT_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH

    public constructor (public readonly endDateTimeSearched: Date | undefined) {}
}

export class SelectMovementsPageVisibilitySearched {
    public static readonly type: MovementActionEnum = MovementActionEnum.SELECT_MOVEMENTS_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
}

export class StartMovementLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.START_MOVEMENT_LOADER
}

export class StopMovementLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.STOP_MOVEMENT_LOADER
}

export class FetchMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class SearchParticipantsAndGroups {
    public static readonly type: MovementActionEnum = MovementActionEnum.SEARCH_PARTICIPANTS_AND_GROUPS

    public constructor (public readonly eventId: string | undefined, public readonly searched: string | undefined) {}
}

export class SearchVehicles {
    public static readonly type: MovementActionEnum = MovementActionEnum.SEARCH_VEHICLES

    public constructor (public readonly eventId: string | undefined, public readonly searched: string | undefined) {}
}

export class ResetMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.RESET_MOVEMENT
}

export class CreateMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.CREATE_MOVEMENT

    public constructor (public readonly eventId: string | undefined, public readonly movement: MovementDto) {}
}

export class UpdateMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.UPDATE_MOVEMENT

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly movement: MovementDto,
    ) {}
}

export class DisableMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.DISABLE_MOVEMENT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class EnableMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.ENABLE_MOVEMENT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class DeleteMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.DELETE_MOVEMENT

    public constructor (public readonly eventId: string | undefined, public readonly movement: MovementModel) {}
}
