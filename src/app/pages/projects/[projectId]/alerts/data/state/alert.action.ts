import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'

enum AlertAction {
    RESET_ALERT_STATE = '[Local] Resetting alert state',

    FETCH_ALERT_STATUS = '[Backend] Fetching alert status',

    START_ALERTS_PAGE_LOADER = '[Local] Starting alerts\' page loader',
    STOP_ALERTS_PAGE_LOADER = '[Local] Stopping alerts\' page loader',
    FETCH_ALERTS_PAGE = '[Backend] Fetching alerts\' page',
    UPDATE_ALERTS_PAGE_SEARCH_PARAMS = '[Local] Updating alerts\' page search params',

    START_ALERT_COMMUNICATIONS_PAGE_LOADER = '[Local] Starting alert communications\' page loader',
    STOP_ALERT_COMMUNICATIONS_PAGE_LOADER = '[Local] Stopping alert communications\' page loader',
    FETCH_ALERT_COMMUNICATIONS_PAGE = '[Backend] Fetching alert communications\' page',
    UPDATE_ALERT_COMMUNICATIONS_PAGE_SEARCH_PARAMS = '[Local] Updating alert communications\' page search params',
}

export class ResetAlertState {
    public static readonly type: AlertAction = AlertAction.RESET_ALERT_STATE
}

export class FetchAlertStatus {
    public static readonly type: AlertAction = AlertAction.FETCH_ALERT_STATUS
}

export class StartAlertsPageLoader {
    public static readonly type: AlertAction = AlertAction.START_ALERTS_PAGE_LOADER
}

export class StopAlertsPageLoader {
    public static readonly type: AlertAction = AlertAction.STOP_ALERTS_PAGE_LOADER
}

export class FetchAlertsPage {
    public static readonly type: AlertAction = AlertAction.FETCH_ALERTS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateAlertsPageSearchParams {
    public static readonly type: AlertAction = AlertAction.UPDATE_ALERTS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: AlertPageParamsModel) {}
}

export class StartAlertCommunicationsPageLoader {
    public static readonly type: AlertAction = AlertAction.START_ALERT_COMMUNICATIONS_PAGE_LOADER
}

export class StopAlertCommunicationsPageLoader {
    public static readonly type: AlertAction = AlertAction.STOP_ALERT_COMMUNICATIONS_PAGE_LOADER
}

export class FetchAlertCommunicationsPage {
    public static readonly type: AlertAction = AlertAction.FETCH_ALERT_COMMUNICATIONS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateAlertCommunicationsPageSearchParams {
    public static readonly type: AlertAction = AlertAction.UPDATE_ALERT_COMMUNICATIONS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: CommunicationPageParamsModel) {}
}
