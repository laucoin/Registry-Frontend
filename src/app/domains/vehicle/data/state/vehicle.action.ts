import { VehicleDto } from '../dto/vehicle.dto'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'

export enum VehicleActionEnum {
    FETCH_VEHICLE_PRESENCES_STATUS = '[Backend] Fetching vehicle presences status',

    START_VEHICLES_PAGE_LOADER = '[Local] Starting vehicles\' page loader',
    STOP_VEHICLES_PAGE_LOADER = '[Local] Stopping vehicles\' page loader',

    FETCH_VEHICLES_PAGE = '[Backend] Fetching vehicles\' page',
    INPUT_VEHICLES_PAGE_TEXT_SEARCH = '[Local] Inputting vehicles\' page text search',
    INPUT_VEHICLES_PAGE_DATE_TIME_SEARCH = '[Local] Inputting vehicles\' page date time search',
    SELECT_VEHICLES_PAGE_AVAILABILITY_SEARCH = '[Local] Selecting vehicles\' page availability search',
    SELECT_VEHICLES_PAGE_VISIBILITY_SEARCH = '[Local] Selecting vehicles\' page visibility search',

    START_VEHICLE_MOVEMENTS_PAGE_LOADER = '[Local] Starting vehicle movements\' page loader',
    STOP_VEHICLE_MOVEMENTS_PAGE_LOADER = '[Local] Stopping vehicle movements\' page loader',

    FETCH_VEHICLE_MOVEMENTS_PAGE = '[Backend] Fetching vehicle movements\' page',
    FETCH_VEHICLE_MOVEMENTS_CONTENTS = '[Backend] Fetching vehicle movements\' contents',
    INPUT_VEHICLE_MOVEMENTS_PAGE_TYPE_SEARCH = '[Local] Inputting vehicle movements\' page type search',
    INPUT_VEHICLE_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH = '[Local] Inputting vehicle movements\' page start date time search',
    INPUT_VEHICLE_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH = '[Local] Inputting vehicle movements\' page end date time search',
    SELECT_VEHICLE_MOVEMENTS_PAGE_VISIBILITY_SEARCH = '[Local] Selecting vehicle movements\' page visibility search',

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
        public readonly eventId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputVehiclesPageTextSearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLES_PAGE_TEXT_SEARCH

    public constructor (public readonly textSearched: string | undefined) {}
}

export class InputVehiclesPageDateTimeSearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLES_PAGE_DATE_TIME_SEARCH

    public constructor (public readonly dateTimeSearched: Date | undefined) {}
}

export class SelectVehiclesPageAvailabilitySearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.SELECT_VEHICLES_PAGE_AVAILABILITY_SEARCH

    public constructor (public readonly availabilitySearched: boolean | undefined) {}
}

export class SelectVehiclesPageVisibilitySearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.SELECT_VEHICLES_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
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
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchVehicleMovementsContents {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.FETCH_VEHICLE_MOVEMENTS_CONTENTS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class SelectVehicleMovementsPageTypeSearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLE_MOVEMENTS_PAGE_TYPE_SEARCH

    public constructor (public readonly typeSearched: string | undefined) {}
}

export class InputVehicleMovementsPageStartDateTimeSearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLE_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH

    public constructor (public readonly startDateTimeSearched: Date | undefined) {}
}

export class InputVehicleMovementsPageEndDateTimeSearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.INPUT_VEHICLE_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH

    public constructor (public readonly endDateTimeSearched: Date | undefined) {}
}

export class SelectVehicleMovementsPageVisibilitySearched {
    public static readonly type: VehicleActionEnum = VehicleActionEnum.SELECT_VEHICLE_MOVEMENTS_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
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
