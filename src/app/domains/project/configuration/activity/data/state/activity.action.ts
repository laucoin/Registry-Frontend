import { ActivityDto } from '../dto/activity.dto'
import { ActivityModel } from '../../../../../../shared/util-model/model/activity.model'
import { ActivityPageParamsModel } from '../model/activity-page-params.model'
import { MovementPageParamsModel } from '../../../../../../shared/util-model/model/movement-page-params.model'

enum ActivityActionEnum {
    RESET_ACTIVITY_STATE = '[Local] Resetting activity state',

    START_ACTIVITIES_PAGE_LOADER = '[Local] Starting activities\' page loader',
    STOP_ACTIVITIES_PAGE_LOADER = '[Local] Stopping activities\' page loader',

    FETCH_ACTIVITIES_PAGE = '[Backend] Fetching activities\' page',
    UPDATE_ACTIVITIES_PAGE_SEARCH_PARAMS = '[Local] Updating activities\' page search params',

    START_ACTIVITY_MOVEMENTS_PAGE_LOADER = '[Local] Starting activity movements\' page loader',
    STOP_ACTIVITY_MOVEMENTS_PAGE_LOADER = '[Local] Stopping activity movements\' page loader',

    FETCH_ACTIVITY_MOVEMENTS_PAGE = '[Backend] Fetching activity movements\' page',
    FETCH_ACTIVITY_MOVEMENTS_CONTENTS = '[Backend] Fetching activity movements\' contents',
    UPDATE_ACTIVITY_MOVEMENTS_PAGE_SEARCH_PARAMS = '[Local] Updating activity movements\' page searched params',

    START_ACTIVITY_LOADER = '[Local] Starting activity\'s loader',
    STOP_ACTIVITY_LOADER = '[Local] Stopping activity\'s loader',

    FETCH_ACTIVITY = '[Backend] Fetching activity',
    RESET_ACTIVITY = '[Local] Resetting activity',
    CREATE_ACTIVITY = '[Backend] Creating activity',
    UPDATE_ACTIVITY = '[Backend] Updating activity',
    DISABLE_ACTIVITY = '[Backend] Disabling activity',
    ENABLE_ACTIVITY = '[Backend] Enabling activity',
    DELETE_ACTIVITY = '[Backend] Deleting activity',
}

export class ResetActivityState {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.RESET_ACTIVITY_STATE
}

export class StartActivitiesPageLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.START_ACTIVITIES_PAGE_LOADER
}

export class StopActivitiesPageLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.STOP_ACTIVITIES_PAGE_LOADER
}

export class FetchActivitiesPage {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.FETCH_ACTIVITIES_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateActivitiesPageSearchParams {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.UPDATE_ACTIVITIES_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: ActivityPageParamsModel) {}
}

export class StartActivityMovementsPageLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.START_ACTIVITY_MOVEMENTS_PAGE_LOADER
}

export class StopActivityMovementsPageLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.STOP_ACTIVITY_MOVEMENTS_PAGE_LOADER
}

export class FetchActivityMovementsPage {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.FETCH_ACTIVITY_MOVEMENTS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchActivityMovementsContents {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.FETCH_ACTIVITY_MOVEMENTS_CONTENTS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class UpdateActivityMovementsPageSearchParams {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.UPDATE_ACTIVITY_MOVEMENTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: MovementPageParamsModel) {}
}

export class StartActivityLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.START_ACTIVITY_LOADER
}

export class StopActivityLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.STOP_ACTIVITY_LOADER
}

export class FetchActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.FETCH_ACTIVITY

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class ResetActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.RESET_ACTIVITY
}

export class CreateActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.CREATE_ACTIVITY

    public constructor (public readonly projectId: string | undefined, public readonly activity: ActivityDto) {}
}

export class UpdateActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.UPDATE_ACTIVITY

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly activity: ActivityDto,
    ) {}
}

export class DisableActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.DISABLE_ACTIVITY

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class EnableActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.ENABLE_ACTIVITY

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class DeleteActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.DELETE_ACTIVITY

    public constructor (public readonly projectId: string | undefined, public readonly activity: ActivityModel) {}
}
