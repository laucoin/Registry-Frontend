import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { VehiclePageParamsModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-page-params.model'

enum VehicleActionEnum {
    RESET_VEHICLE_STATE = '[Local] Resetting vehicle state',

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

}

export class ResetVehicleState {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.RESET_VEHICLE_STATE
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
