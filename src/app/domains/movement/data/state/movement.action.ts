import { MovementDto } from '../dto/movement.dto'
import { MovementModel } from '../model/movement.model'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { MovementTypeEnum } from '../model/movement-type.enum'

export enum MovementActionEnum {
    START_MOVEMENTS_PAGE_LOADER = '[Local] Starting movement\'s page loader',
    STOP_MOVEMENTS_PAGE_LOADER = '[Local] Stopping movement\'s page loader',

    START_MOVEMENT_LOADER = '[Local] Starting movement loader',
    STOP_MOVEMENT_LOADER = '[Local] Stopping movement loader',

    FETCH_MOVEMENT_PAGE = '[Backend] Fetching movement page',
    INPUT_MOVEMENT_PAGE_SEARCH = '[Local] Inputting movement page search',
    SELECT_MOVEMENT_PAGE_TYPE = '[Local] Selecting movement page type',
    INPUT_MOVEMENT_PAGE_DATE_RANGE = '[Local] Inputting movement page date range',
    SELECT_MOVEMENT_PAGE_VISIBILITY = '[Local] Selecting movement page visibility',
    SELECT_MOVEMENT_PAGE_ORDER = '[Local] Selecting movement page order',

    FETCH_MOVEMENT = '[Backend] Fetching movement',
    CREATE_MOVEMENT = '[Backend] Creating movement',
    UPDATE_MOVEMENT = '[Backend] Updating movement',
    DISABLE_MOVEMENT = '[Backend] Disabling movement',
    ENABLE_MOVEMENT = '[Backend] Enabling movement',
    DELETE_MOVEMENT = '[Backend] Deleting movement',

    RESET_MOVEMENT = '[Local] Resetting movement',
}

export class StartMovementsPageLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.START_MOVEMENTS_PAGE_LOADER
}

export class StopMovementsPageLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.STOP_MOVEMENTS_PAGE_LOADER
}

export class StartMovementLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.START_MOVEMENT_LOADER
}

export class StopMovementLoader {
    public static readonly type: MovementActionEnum = MovementActionEnum.STOP_MOVEMENT_LOADER
}

export class FetchMovementPage {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENT_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputMovementPageSearch {
    public static readonly type: MovementActionEnum = MovementActionEnum.INPUT_MOVEMENT_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class SelectMovementPageType {
    public static readonly type: MovementActionEnum = MovementActionEnum.SELECT_MOVEMENT_PAGE_TYPE

    public constructor (public readonly type: MovementTypeEnum | undefined) {}
}

export class InputMovementPageDateRange {
    public static readonly type: MovementActionEnum = MovementActionEnum.INPUT_MOVEMENT_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectMovementPageVisibility {
    public static readonly type: MovementActionEnum = MovementActionEnum.SELECT_MOVEMENT_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectMovementPageOrder {
    public static readonly type: MovementActionEnum = MovementActionEnum.SELECT_MOVEMENT_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class FetchMovement {
    public static readonly type: MovementActionEnum = MovementActionEnum.FETCH_MOVEMENT

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
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
