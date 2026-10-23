import { ActivityPageParamsModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'

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
