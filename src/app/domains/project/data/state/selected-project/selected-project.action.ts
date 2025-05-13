enum SelectedProjectActionEnum {
    START_PARTICIPANTS_STATUS_LOADER = '[Local] Starting participants\' status loader',
    STOP_PARTICIPANTS_STATUS_LOADER = '[Local] Stopping participants\' status loader',
    FETCH_PARTICIPANTS_STATUS = '[Backend] Fetching participants status',

    START_VEHICLES_STATUS_LOADER = '[Local] Starting vehicles\' status loader',
    STOP_VEHICLES_STATUS_LOADER = '[Local] Stopping vehicles\' status loader',
    FETCH_VEHICLES_STATUS = '[Backend] Fetching vehicles status',

    FETCH_PARTICIPANTS_BIRTHDAYS = '[Backend] Fetching participants birthdays',

    START_CURRENT_MOVEMENTS_PAGE_WITHOUT_ACTIVITY_LOADER = '[Local] Starting current movements\' page without activity loader',
    STOP_CURRENT_MOVEMENTS_WITHOUT_ACTIVITY_PAGE_LOADER = '[Local] Stopping current movements\' page without activity loader',
    FETCH_CURRENT_MOVEMENTS_PAGE_WITHOUT_ACTIVITY = '[Backend] Fetching current movements\' page (without activity)',
    FETCH_CURRENT_MOVEMENTS_WITHOUT_ACTIVITY_CONTENTS = '[Backend] Fetching current movements\' (without activity) contents',

    START_CURRENT_MOVEMENTS_PAGE_WITH_ACTIVITY_LOADER = '[Local] Starting current movements\' page with activity loader',
    STOP_CURRENT_MOVEMENTS_PAGE_WITH_ACTIVITY_LOADER = '[Local] Stopping current movements\' page with activity loader',
    FETCH_CURRENT_MOVEMENTS_PAGE_WITH_ACTIVITY = '[Backend] Fetching current movements\' page (with activity)',
    FETCH_CURRENT_MOVEMENTS_WITH_ACTIVITY_CONTENTS = '[Backend] Fetching current movements\' (with activity) contents',
}

export class StartParticipantsStatusLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.START_PARTICIPANTS_STATUS_LOADER
}

export class StopParticipantsStatusLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.STOP_PARTICIPANTS_STATUS_LOADER
}

export class FetchParticipantsStatus {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.FETCH_PARTICIPANTS_STATUS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class StartVehiclesStatusLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.START_VEHICLES_STATUS_LOADER
}

export class StopVehiclesStatusLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.STOP_VEHICLES_STATUS_LOADER
}

export class FetchVehiclesStatus {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.FETCH_VEHICLES_STATUS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchParticipantsBirthdays {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.FETCH_PARTICIPANTS_BIRTHDAYS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class StartCurrentMovementsPageWithoutActivityLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.START_CURRENT_MOVEMENTS_PAGE_WITHOUT_ACTIVITY_LOADER
}

export class StopCurrentMovementsPageWithoutActivityLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.STOP_CURRENT_MOVEMENTS_WITHOUT_ACTIVITY_PAGE_LOADER
}

export class FetchCurrentMovementsPageWithoutActivity {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.FETCH_CURRENT_MOVEMENTS_PAGE_WITHOUT_ACTIVITY

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchCurrentMovementsWithoutActivityContents {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.FETCH_CURRENT_MOVEMENTS_WITHOUT_ACTIVITY_CONTENTS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}

export class StartCurrentMovementsPageWithActivityLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.START_CURRENT_MOVEMENTS_PAGE_WITH_ACTIVITY_LOADER
}

export class StopCurrentMovementsPageWithActivityLoader {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.STOP_CURRENT_MOVEMENTS_PAGE_WITH_ACTIVITY_LOADER
}

export class FetchCurrentMovementsPageWithActivity {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.FETCH_CURRENT_MOVEMENTS_PAGE_WITH_ACTIVITY

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchCurrentMovementsWithActivityContents {
    public static readonly type: SelectedProjectActionEnum = SelectedProjectActionEnum.FETCH_CURRENT_MOVEMENTS_WITH_ACTIVITY_CONTENTS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly movementIds: string[],
    ) {}
}
