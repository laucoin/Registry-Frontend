import { AlertPageParamsModel } from '../../../../../shared/util-model/model/alert-page-params.model'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import { AlertDto } from '../dto/alert.dto'
import { CommunicationPageParamsModel } from '../../../communication/data/model/communication-page-params.model'
import { AlertStatusEnum } from '../../../../../shared/util-model/enumeration/alert-status.enum'

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

    START_ALERT_LOADER = '[Local] Starting alert loader',
    STOP_ALERT_LOADER = '[Local] Stopping alert loader',
    FETCH_ALERT = '[Backend] Fetching alert',
    RESET_ALERT = '[Local] Resetting alert',
    CREATE_ALERT = '[Backend] Creating alert',
    UPDATE_ALERT = '[Backend] Updating alert',
    UPDATE_ALERT_STATUS = '[Backend] Updating alert status',
    DISABLE_ALERT = '[Backend] Disabling alert',
    ENABLE_ALERT = '[Backend] Enabling alert',
    DELETE_ALERT = '[Backend] Deleting alert',
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

export class StartAlertLoader {
    public static readonly type: AlertAction = AlertAction.START_ALERT_LOADER
}

export class StopAlertLoader {
    public static readonly type: AlertAction = AlertAction.STOP_ALERT_LOADER
}

export class FetchAlert {
    public static readonly type: AlertAction = AlertAction.FETCH_ALERT

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class ResetAlert {
    public static readonly type: AlertAction = AlertAction.RESET_ALERT
}

export class CreateAlert {
    public static readonly type: AlertAction = AlertAction.CREATE_ALERT

    public constructor (
        public readonly projectId: string | undefined,
        public readonly alert: AlertDto,
    ) {}
}

export class UpdateAlert {
    public static readonly type: AlertAction = AlertAction.UPDATE_ALERT

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly alert: AlertDto,
    ) {}
}

export class UpdateAlertStatus {
    public static readonly type: AlertAction = AlertAction.UPDATE_ALERT_STATUS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string,
        public readonly status: AlertStatusEnum,
    ) {}
}

export class DisableAlert {
    public static readonly type: AlertAction = AlertAction.DISABLE_ALERT

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class EnableAlert {
    public static readonly type: AlertAction = AlertAction.ENABLE_ALERT

    public constructor (public readonly projectId: string | undefined, public readonly id: string) {}
}

export class DeleteAlert {
    public static readonly type: AlertAction = AlertAction.DELETE_ALERT

    public constructor (
        public readonly projectId: string | undefined,
        public readonly alert: AlertModel,
    ) {}
}
