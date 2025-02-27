import { ActivityDto } from '../dto/activity.dto'
import { ActivityModel } from '../../../../shared/util-model/model/activity.model'

export enum ActivityActionEnum {
    START_ACTIVITIES_PAGE_LOADER = '[Local] Starting activities\' page loader',
    STOP_ACTIVITIES_PAGE_LOADER = '[Local] Stopping activities\' page loader',

    FETCH_ACTIVITIES_PAGE = '[Backend] Fetching activities\' page',
    INPUT_ACTIVITIES_PAGE_TEXT_SEARCH = '[Local] Inputting activities\' page text search',
    INPUT_ACTIVITIES_PAGE_DATE_TIME_SEARCH = '[Local] Inputting activities\' page date time search',
    SELECT_ACTIVITIES_PAGE_AVAILABILITY_SEARCH = '[Local] Selecting activities\' page availability search',
    SELECT_ACTIVITIES_PAGE_VISIBILITY_SEARCH = '[Local] Selecting activities\' page visibility search',

    START_ACTIVITY_MOVEMENTS_PAGE_LOADER = '[Local] Starting activity movements\' page loader',
    STOP_ACTIVITY_MOVEMENTS_PAGE_LOADER = '[Local] Stopping activity movements\' page loader',

    FETCH_ACTIVITY_MOVEMENTS_PAGE = '[Backend] Fetching activity movements\' page',
    FETCH_ACTIVITY_MOVEMENTS_CONTENTS = '[Backend] Fetching activity movements\' contents',
    INPUT_ACTIVITY_MOVEMENTS_PAGE_TYPE_SEARCH = '[Local] Inputting activity movements\' page type search',
    INPUT_ACTIVITY_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH = '[Local] Inputting activity movements\' page start date time search',
    INPUT_ACTIVITY_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH = '[Local] Inputting activity movements\' page end date time search',
    SELECT_ACTIVITY_MOVEMENTS_PAGE_VISIBILITY_SEARCH = '[Local] Selecting activity movements\' page visibility search',

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

export class StartActivitiesPageLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.START_ACTIVITIES_PAGE_LOADER
}

export class StopActivitiesPageLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.STOP_ACTIVITIES_PAGE_LOADER
}

export class FetchActivitiesPage {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.FETCH_ACTIVITIES_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputActivitiesPageTextSearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.INPUT_ACTIVITIES_PAGE_TEXT_SEARCH

    public constructor (public readonly textSearched: string | undefined) {}
}

export class InputActivitiesPageDateTimeSearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.INPUT_ACTIVITIES_PAGE_DATE_TIME_SEARCH

    public constructor (public readonly dateTimeSearched: Date | undefined) {}
}

export class SelectActivitiesPageAvailabilitySearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.SELECT_ACTIVITIES_PAGE_AVAILABILITY_SEARCH

    public constructor (public readonly availabilitySearched: boolean | undefined) {}
}

export class SelectActivitiesPageVisibilitySearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.SELECT_ACTIVITIES_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
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
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchActivityMovementsContents {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.FETCH_ACTIVITY_MOVEMENTS_CONTENTS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class SelectActivityMovementsPageTypeSearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.INPUT_ACTIVITY_MOVEMENTS_PAGE_TYPE_SEARCH

    public constructor (public readonly typeSearched: string | undefined) {}
}

export class InputActivityMovementsPageStartDateTimeSearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.INPUT_ACTIVITY_MOVEMENTS_PAGE_START_DATE_TIME_SEARCH

    public constructor (public readonly startDateTimeSearched: Date | undefined) {}
}

export class InputActivityMovementsPageEndDateTimeSearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.INPUT_ACTIVITY_MOVEMENTS_PAGE_END_DATE_TIME_SEARCH

    public constructor (public readonly endDateTimeSearched: Date | undefined) {}
}

export class SelectActivityMovementsPageVisibilitySearched {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.SELECT_ACTIVITY_MOVEMENTS_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
}

export class StartActivityLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.START_ACTIVITY_LOADER
}

export class StopActivityLoader {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.STOP_ACTIVITY_LOADER
}

export class FetchActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.FETCH_ACTIVITY

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class ResetActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.RESET_ACTIVITY
}

export class CreateActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.CREATE_ACTIVITY

    public constructor (public readonly eventId: string | undefined, public readonly activity: ActivityDto) {}
}

export class UpdateActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.UPDATE_ACTIVITY

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly activity: ActivityDto,
    ) {}
}

export class DisableActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.DISABLE_ACTIVITY

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class EnableActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.ENABLE_ACTIVITY

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class DeleteActivity {
    public static readonly type: ActivityActionEnum = ActivityActionEnum.DELETE_ACTIVITY

    public constructor (public readonly eventId: string | undefined, public readonly activity: ActivityModel) {}
}
