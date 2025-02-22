import { VehicleDto } from '../dto/vehicle.dto'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'

export enum VehicleActionEnum {
    START_VEHICLES_PAGE_LOADER = '[Local] Starting vehicles\' page loader',
    STOP_VEHICLES_PAGE_LOADER = '[Local] Stopping vehicles\' page loader',

    FETCH_VEHICLES_PAGE = '[Backend] Fetching vehicles\' page',
    INPUT_VEHICLES_PAGE_SEARCH = '[Local] Inputting vehicles\' page search',
    INPUT_VEHICLES_PAGE_DATE_RANGE = '[Local] Inputting vehicles\' page date range',
    SELECT_VEHICLES_PAGE_VISIBILITY = '[Local] Selecting vehicles\' page visibility',
    SELECT_VEHICLES_PAGE_ORDER = '[Local] Selecting vehicles\' page order',

    START_VEHICLE_MOVEMENTS_PAGE_LOADER = '[Local] Starting vehicle movements\' page loader',
    STOP_VEHICLE_MOVEMENTS_PAGE_LOADER = '[Local] Stopping vehicle movements\' page loader',

    FETCH_VEHICLE_MOVEMENT_TYPES = '[Backend] Fetching vehicle movement types',

    FETCH_VEHICLE_MOVEMENTS_PAGE = '[Backend] Fetching vehicle movements\' page',
    INPUT_VEHICLE_MOVEMENTS_PAGE_SEARCH = '[Local] Inputting vehicle movements\' page search',
    INPUT_VEHICLE_MOVEMENTS_PAGE_TYPE = '[Local] Inputting vehicle movements\' page type',
    INPUT_VEHICLE_MOVEMENTS_PAGE_DATE_RANGE = '[Local] Inputting vehicle movements\' page date range',
    SELECT_VEHICLE_MOVEMENTS_PAGE_VISIBILITY = '[Local] Selecting vehicle movements\' page visibility',
    SELECT_VEHICLE_MOVEMENTS_PAGE_ORDER = '[Local] Selecting vehicle movements\' page order',

    START_VEHICLE_LOADER = '[Local] Starting vehicle\'s loader',
    STOP_VEHICLE_LOADER = '[Local] Stopping vehicle\'s loader',

    FETCH_VEHICLE = '[Backend] Fetching vehicle',
    RESET_VEHICLE = '[Local] Resetting vehicle',
    CREATE_VEHICLE = '[Backend] Creating vehicle',
    UPDATE_VEHICLE = '[Backend] Updating vehicle',
    DISABLE_VEHICLE = '[Backend] Disabling vehicle',
    ENABLE_VEHICLE = '[Backend] Enabling vehicle',
    DELETE_VEHICLE = '[Backend] Deleting vehicle',
}

export class StartVehiclesPageLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.START_VEHICLES_PAGE_LOADER
}

export class StopVehiclesPageLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.STOP_VEHICLES_PAGE_LOADER
}

export class FetchVehiclesPage {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLES_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputVehiclesPageSearch {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLES_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputVehiclesPageDateRange {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLES_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectVehiclesPageVisibility {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.SELECT_VEHICLES_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectVehiclesPageOrder {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.SELECT_VEHICLES_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class StartVehicleMovementsPageLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.START_VEHICLE_MOVEMENTS_PAGE_LOADER
}

export class StopVehicleMovementsPageLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.STOP_VEHICLE_MOVEMENTS_PAGE_LOADER
}

export class FetchVehicleMovementTypes {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE_MOVEMENT_TYPES

    public constructor (public readonly eventId: string | undefined) {}
}

export class FetchVehicleMovementsPage {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE_MOVEMENTS_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputVehicleMovementsPageSearch {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLE_MOVEMENTS_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class SelectVehicleMovementsPageType {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLE_MOVEMENTS_PAGE_TYPE

    public constructor (public readonly type: string | undefined) {}
}

export class InputVehicleMovementsPageDateRange {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLE_MOVEMENTS_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectVehicleMovementsPageVisibility {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.SELECT_VEHICLE_MOVEMENTS_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectVehicleMovementsPageOrder {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.SELECT_VEHICLE_MOVEMENTS_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class StartVehicleLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.START_VEHICLE_LOADER
}

export class StopVehicleLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.STOP_VEHICLE_LOADER
}

export class FetchVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class ResetVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.RESET_VEHICLE
}

export class CreateVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.CREATE_VEHICLE

    public constructor (public readonly eventId: string | undefined, public readonly vehicle: VehicleDto) {}
}

export class UpdateVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.UPDATE_VEHICLE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly vehicle: VehicleDto,
    ) {}
}

export class DisableVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.DISABLE_VEHICLE

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class EnableVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.ENABLE_VEHICLE

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class DeleteVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.DELETE_VEHICLE

    public constructor (public readonly eventId: string | undefined, public readonly vehicle: VehicleModel) {}
}
