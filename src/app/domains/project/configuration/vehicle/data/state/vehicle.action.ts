import { VehicleDto } from '../dto/vehicle.dto'
import { VehicleModel } from '../../../../../../shared/util-model/model/vehicle.model'
import { MovementPageParamsModel } from '../../../../../../shared/util-model/model/movement-page-params.model'
import { VehiclePageParamsModel } from '../model/vehicle-page-params.model'

export enum VehicleActionEnum {
    FETCH_VEHICLE_PRESENCES_STATUS = '[Backend] Fetching vehicle presences status',

    START_VEHICLES_PAGE_LOADER = '[Local] Starting vehicles\' page loader',
    STOP_VEHICLES_PAGE_LOADER = '[Local] Stopping vehicles\' page loader',

    FETCH_VEHICLES_PAGE = '[Backend] Fetching vehicles\' page',
    UPDATE_VEHICLES_PAGE_SEARCH_PARAMS = '[Local] Updating vehicles\' page search params',

    START_VEHICLE_MOVEMENTS_PAGE_LOADER = '[Local] Starting vehicle movements\' page loader',
    STOP_VEHICLE_MOVEMENTS_PAGE_LOADER = '[Local] Stopping vehicle movements\' page loader',

    FETCH_VEHICLE_MOVEMENTS_PAGE = '[Backend] Fetching vehicle movements\' page',
    FETCH_VEHICLE_MOVEMENTS_CONTENTS = '[Backend] Fetching vehicle movements\' contents',
    UPDATE_VEHICLE_MOVEMENTS_PAGE_SEARCH_PARAMS = '[Local] Updating vehicle movements\' page search params',

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

export class FetchVehiclePresencesStatus {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE_PRESENCES_STATUS
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
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateVehiclesPageSearchParams {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.UPDATE_VEHICLES_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: VehiclePageParamsModel) {}
}

export class StartVehicleMovementsPageLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.START_VEHICLE_MOVEMENTS_PAGE_LOADER
}

export class StopVehicleMovementsPageLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.STOP_VEHICLE_MOVEMENTS_PAGE_LOADER
}

export class FetchVehicleMovementsPage {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE_MOVEMENTS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchVehicleMovementsContents {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE_MOVEMENTS_CONTENTS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class UpdateVehicleMovementsPageSearchParams {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.UPDATE_VEHICLE_MOVEMENTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: MovementPageParamsModel) {}
}

export class StartVehicleLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.START_VEHICLE_LOADER
}

export class StopVehicleLoader {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.STOP_VEHICLE_LOADER
}

export class FetchVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class ResetVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.RESET_VEHICLE
}

export class CreateVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.CREATE_VEHICLE

    public constructor (public readonly projectId: string | undefined, public readonly vehicle: VehicleDto) {}
}

export class UpdateVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.UPDATE_VEHICLE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly vehicle: VehicleDto,
    ) {}
}

export class DisableVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.DISABLE_VEHICLE

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class EnableVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.ENABLE_VEHICLE

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class DeleteVehicle {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.DELETE_VEHICLE

    public constructor (public readonly projectId: string | undefined, public readonly vehicle: VehicleModel) {}
}
