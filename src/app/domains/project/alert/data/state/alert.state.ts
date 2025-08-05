import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { GenericProjectElementState } from '../../../../../shared/util-tool/state/generic-project-element.state'
import { initialize } from '../../../../../shared/util-tool/util/rx.util'
import { StateUtil } from '../../../../../shared/util-tool/state/state.util'
import { inject, Injectable } from '@angular/core'
import {
    ElementRequestInformationModel,
} from '../../../../../shared/util-model/model/element-request-information.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../../../../shared/util-model/model/error.model'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'
import { AlertFacade } from './alert.facade'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import { AlertStateModel } from '../model/alert-state.model'
import { AlertService } from '../../../movement/data/state/alert.service'
import { AlertStatusEnum } from '../../../../../shared/util-model/enumeration/alert-status.enum'
import {
    CreateAlert,
    DeleteAlert,
    DisableAlert,
    EnableAlert,
    FetchAlert,
    FetchAlertCommunicationsPage,
    FetchAlertsPage,
    FetchAlertStatus,
    ResetAlert,
    ResetAlertState,
    StartAlertCommunicationsPageLoader,
    StartAlertLoader,
    StartAlertsPageLoader,
    StopAlertCommunicationsPageLoader,
    StopAlertLoader,
    StopAlertsPageLoader,
    UpdateAlert,
    UpdateAlertCommunicationsPageSearchParams,
    UpdateAlertsPageSearchParams,
    UpdateAlertStatus,
} from './alert.action'
import { MetadataService } from '../../../../../shared/util-common/state/metadata.service'
import { CommunicationModel } from '../../../communication/data/model/communication.model'

const defaultAlert: ElementRequestInformationModel<AlertModel> = {
    element: undefined,
    loading: false,
}

const defaultAlertState: AlertStateModel = {
    alerts: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            statusSearched: undefined,
            visibilitySearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    alert: defaultAlert,
    communications: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            visibilitySearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    _metadata: {
        status: [],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'alerts.visible.true', value: true },
            { label: 'alerts.visible.false', value: false },
        ],
    },
}

@State<AlertStateModel>( {
    name: 'alert',
    defaults: defaultAlertState,
} )
@Injectable()
export class AlertState extends GenericProjectElementState<AlertStateModel> implements NgxsOnInit {
    private readonly alertIcon: string = 'pi pi-sort-alt'

    private readonly service: AlertService = inject( AlertService )
    private readonly metadataService: MetadataService = inject( MetadataService )
    private readonly facade: AlertFacade = inject( AlertFacade )

    public ngxsOnInit (): void {
        this.facade.fetchAlertStatus()
    }

    @Selector()
    public static alertsPage (state: AlertStateModel): PageModel<AlertModel> | undefined {
        return state.alerts.element
    }

    @Selector()
    public static alertsPageLoading (state: AlertStateModel): boolean {
        return state.alerts.loading
    }

    @Selector()
    public static alertsPageError (state: AlertStateModel): ToastMessageOptions | undefined {
        return state.alerts.error
    }

    @Selector()
    public static alertsPageSilentLoading (state: AlertStateModel): boolean {
        return state.alerts.silentLoading
    }

    @Selector()
    public static alertsPageResetSearch (state: AlertStateModel): boolean {
        return state.alerts.params.resetSearch
    }

    @Selector()
    public static alertsPageTextSearchedParam (state: AlertStateModel): string | undefined {
        return state.alerts.params.textSearched
    }

    @Selector()
    public static alertsPageStatusSearchedParam (state: AlertStateModel): AlertStatusEnum | undefined {
        return state.alerts.params.statusSearched
    }

    @Selector()
    public static alertsPageVisibilitySearchedParam (state: AlertStateModel): boolean | undefined {
        return state.alerts.params.visibilitySearched
    }

    @Selector()
    public static alertsPageStartDateTimeSearchedParam (state: AlertStateModel): string | undefined {
        return state.alerts.params.startDateTimeSearched
    }

    @Selector()
    public static alertsPageEndDateTimeSearchedParam (state: AlertStateModel): string | undefined {
        return state.alerts.params.endDateTimeSearched
    }

    @Selector()
    public static alertCommunicationsPage (state: AlertStateModel): PageModel<CommunicationModel> | undefined {
        return state.communications.element
    }

    @Selector()
    public static alertCommunicationsPageLoading (state: AlertStateModel): boolean {
        return state.communications.loading
    }

    @Selector()
    public static alertCommunicationsPageError (state: AlertStateModel): ToastMessageOptions | undefined {
        return state.communications.error
    }

    @Selector()
    public static alertCommunicationsPageSilentLoading (state: AlertStateModel): boolean {
        return state.communications.silentLoading
    }

    @Selector()
    public static alertCommunicationsPageResetSearch (state: AlertStateModel): boolean {
        return state.communications.params.resetSearch
    }

    @Selector()
    public static alertCommunicationsPageTextSearchedParam (state: AlertStateModel): string | undefined {
        return state.communications.params.textSearched
    }

    @Selector()
    public static alertCommunicationsPageVisibilitySearchedParam (state: AlertStateModel): boolean | undefined {
        return state.communications.params.visibilitySearched
    }

    @Selector()
    public static alertCommunicationsPageStartDateTimeSearchedParam (state: AlertStateModel): string | undefined {
        return state.communications.params.startDateTimeSearched
    }

    @Selector()
    public static alertCommunicationsPageEndDateTimeSearchedParam (state: AlertStateModel): string | undefined {
        return state.communications.params.endDateTimeSearched
    }

    @Selector()
    public static alert (state: AlertStateModel): AlertModel | undefined {
        return state.alert.element
    }

    @Selector()
    public static alertLoading (state: AlertStateModel): boolean {
        return state.alert.loading
    }

    @Selector()
    public static alertStatusMetadata (state: AlertStateModel): SelectItem<AlertStatusEnum | undefined>[] {
        return state._metadata.status
    }

    @Selector()
    public static visibilitiesMetadata (state: AlertStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetAlertState )
    public resetAlertState (ctx: StateContext<AlertStateModel>): void {
        ctx.setState( {
            ...defaultAlertState,
            _metadata: {
                ...defaultAlertState._metadata,
                status: ctx.getState()._metadata.status,
            },
        } )
    }

    @Action( FetchAlertStatus )
    public fetchAlertStatus (ctx: StateContext<AlertStateModel>): Observable<void> {
        return this.metadataService.getAlertsStatus().pipe(
            map( (status: SelectItem<AlertStatusEnum>[]): void => this.fetchAlertStatusComplete( ctx, status ) ),
        )
    }

    private fetchAlertStatusComplete (
        ctx: StateContext<AlertStateModel>,
        status: SelectItem<AlertStatusEnum>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                status: [
                    { label: '-', value: undefined },
                    ...status,
                ],
            },
        } )
    }

    @Action( StartAlertsPageLoader )
    public startAlertsPageLoader (ctx: StateContext<AlertStateModel>): void {
        ctx.patchState( {
            alerts: StateUtil.updatePageLoader( ctx.getState().alerts, true ),
        } )
    }

    @Action( StopAlertsPageLoader )
    public stopAlertsPageLoader (ctx: StateContext<AlertStateModel>): void {
        ctx.patchState( {
            alerts: StateUtil.updatePageLoader( ctx.getState().alerts, false ),
        } )
    }

    @Action( FetchAlertsPage )
    public fetchAlertsPage (
        ctx: StateContext<AlertStateModel>,
        payload: FetchAlertsPage,
    ): Observable<void> {
        return this.service.findAlerts(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().alerts.params,
        ).pipe(
            initialize( (): void => this.facade.startAlertsPageLoader() ),
            finalize( (): void => this.facade.stopAlertsPageLoader() ),
            map( (alertsPage: PageModel<AlertModel>): void => this.fetchAlertsPageComplete(
                ctx,
                alertsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchAlertsPageComplete (
        ctx: StateContext<AlertStateModel>,
        alertsPage: PageModel<AlertModel>,
    ): void {
        ctx.patchState( {
            alerts: {
                ...ctx.getState().alerts,
                params: {
                    ...ctx.getState().alerts.params,
                    resetSearch: false,
                },
                element: alertsPage,
            },
        } )
    }

    @Action( UpdateAlertsPageSearchParams )
    public updateAlertsPageSearchParams (
        ctx: StateContext<AlertStateModel>,
        payload: UpdateAlertsPageSearchParams,
    ): void {
        ctx.patchState( {
            alerts: {
                ...ctx.getState().alerts,
                params: payload.params,
            },
        } )
    }

    @Action( StartAlertCommunicationsPageLoader )
    public startAlertCommunicationsPageLoader (ctx: StateContext<AlertStateModel>): void {
        ctx.patchState( {
            communications: StateUtil.updatePageLoader( ctx.getState().communications, true ),
        } )
    }

    @Action( StopAlertCommunicationsPageLoader )
    public stopAlertCommunicationsPageLoader (ctx: StateContext<AlertStateModel>): void {
        ctx.patchState( {
            communications: StateUtil.updatePageLoader( ctx.getState().communications, false ),
        } )
    }

    @Action( FetchAlertCommunicationsPage )
    public fetchAlertCommunicationsPage (
        ctx: StateContext<AlertStateModel>,
        payload: FetchAlertCommunicationsPage,
    ): Observable<void> {
        return this.service.findAlertCommunications(
            payload.projectId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().alerts.params,
        ).pipe(
            initialize( (): void => this.facade.startAlertCommunicationsPageLoader() ),
            finalize( (): void => this.facade.stopAlertCommunicationsPageLoader() ),
            map( (alertsPage: PageModel<CommunicationModel>): void => this.fetchAlertCommunicationsPageComplete(
                ctx,
                alertsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchAlertCommunicationsPageError( ctx, error ) ),
        )
    }

    private fetchAlertCommunicationsPageComplete (
        ctx: StateContext<AlertStateModel>,
        communicationsPage: PageModel<CommunicationModel>,
    ): void {
        ctx.patchState( {
            communications: {
                ...ctx.getState().alerts,
                params: {
                    ...ctx.getState().alerts.params,
                    resetSearch: false,
                },
                element: communicationsPage,
            },
        } )
    }

    protected fetchAlertCommunicationsPageError (
        ctx: StateContext<AlertStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                communications: this.buildErrorMessage( ctx.getState().communications, error ),
            } )
        }

        return of()
    }

    @Action( UpdateAlertCommunicationsPageSearchParams )
    public updateAlertCommunicationsPageSearchParams (
        ctx: StateContext<AlertStateModel>,
        payload: UpdateAlertCommunicationsPageSearchParams,
    ): void {
        ctx.patchState( {
            communications: {
                ...ctx.getState().communications,
                params: payload.params,
            },
        } )
    }

    @Action( StartAlertLoader )
    public startAlertLoader (ctx: StateContext<AlertStateModel>): void {
        ctx.patchState( {
            alert: StateUtil.updateElementLoader( ctx.getState().alert, true ),
        } )
    }

    @Action( StopAlertLoader )
    public stopAlertLoader (ctx: StateContext<AlertStateModel>): void {
        ctx.patchState( {
            alert: StateUtil.updateElementLoader( ctx.getState().alert, false ),
        } )
    }

    @Action( FetchAlert )
    public fetchAlert (
        ctx: StateContext<AlertStateModel>,
        payload: FetchAlert,
    ): Observable<void> {
        return this.service.findAlertById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startAlertLoader() ),
            finalize( (): void => this.facade.stopAlertLoader() ),
            map( (alert: AlertModel): void => this.fetchAlertComplete( ctx, alert ) ),
        )
    }

    private fetchAlertComplete (
        ctx: StateContext<AlertStateModel>,
        alert: AlertModel,
    ): void {
        ctx.patchState( {
            alert: {
                ...ctx.getState().alert,
                element: alert,
            },
        } )
    }

    @Action( ResetAlert )
    public resetAlert (ctx: StateContext<AlertStateModel>): void {
        ctx.patchState( {
            alert: defaultAlert,
        } )
    }

    @Action( CreateAlert )
    public createAlert (
        ctx: StateContext<AlertStateModel>,
        payload: CreateAlert,
    ): Observable<void> {
        return this.service.createAlert( payload.projectId, payload.alert ).pipe(
            initialize( (): void => this.facade.startAlertLoader() ),
            finalize( (): void => this.facade.stopAlertLoader() ),
            map( (alert: AlertModel): void => this.createAlertComplete( ctx, alert ) ),
        )
    }

    private createAlertComplete (
        ctx: StateContext<AlertStateModel>,
        alert: AlertModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `alerts.notifications.create.title`,
            `alerts.notifications.create.message`,
            this.alertIcon,
            this.buildTranslationArgs( alert ),
        )
        this.refreshPage( ctx )
    }

    @Action( UpdateAlert )
    public updateAlert (
        ctx: StateContext<AlertStateModel>,
        payload: UpdateAlert,
    ): Observable<void> {
        return this.service.updateAlertById( payload.projectId, payload.id, payload.alert ).pipe(
            initialize( (): void => this.facade.startAlertLoader() ),
            finalize( (): void => this.facade.stopAlertLoader() ),
            map( (alert: AlertModel): void => this.updateAlertComplete( ctx, alert ) ),
        )
    }

    private updateAlertComplete (
        ctx: StateContext<AlertStateModel>,
        alert: AlertModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `alerts.notifications.edit.title`,
            `alerts.notifications.edit.message`,
            this.alertIcon,
            this.buildTranslationArgs( alert ),
        )
        this.refreshPage( ctx )
    }

    @Action( UpdateAlertStatus )
    public updateAlertStatus (
        ctx: StateContext<AlertStateModel>,
        payload: UpdateAlertStatus,
    ): Observable<void> {
        return this.service.updateAlertStatusById( payload.projectId, payload.id, payload.status ).pipe(
            initialize( (): void => this.facade.startAlertLoader() ),
            finalize( (): void => this.facade.stopAlertLoader() ),
            map( (alert: AlertModel): void => this.updateAlertStatusComplete( ctx, alert ) ),
        )
    }

    private updateAlertStatusComplete (
        ctx: StateContext<AlertStateModel>,
        alert: AlertModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `alerts.notifications.edit-status.title`,
            `alerts.notifications.edit-status.message`,
            this.alertIcon,
            this.buildTranslationArgs( alert ),
        )
        this.refreshPage( ctx )
    }

    @Action( DisableAlert )
    public disableAlert (
        ctx: StateContext<AlertStateModel>,
        payload: DisableAlert,
    ): Observable<void> {
        return this.service.disableAlertById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startAlertLoader() ),
            finalize( (): void => this.facade.stopAlertLoader() ),
            map( (alert: AlertModel): void => this.disableAlertComplete( ctx, alert ) ),
        )
    }

    private disableAlertComplete (
        ctx: StateContext<AlertStateModel>,
        alert: AlertModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `alerts.notifications.disable.title`,
            `alerts.notifications.disable.message`,
            this.alertIcon,
            this.buildTranslationArgs( alert ),
        )
        this.refreshPage( ctx )
    }

    @Action( EnableAlert )
    public enableAlert (
        ctx: StateContext<AlertStateModel>,
        payload: EnableAlert,
    ): Observable<void> {
        return this.service.enableAlertById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startAlertLoader() ),
            finalize( (): void => this.facade.stopAlertLoader() ),
            map( (alert: AlertModel): void => this.enableAlertComplete( ctx, alert ) ),
        )
    }

    private enableAlertComplete (
        ctx: StateContext<AlertStateModel>,
        alert: AlertModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `alerts.notifications.enable.title`,
            `alerts.notifications.enable.message`,
            this.alertIcon,
            this.buildTranslationArgs( alert ),
        )
        this.refreshPage( ctx )
    }

    @Action( DeleteAlert )
    public deleteAlert (
        ctx: StateContext<AlertStateModel>,
        payload: DeleteAlert,
    ): Observable<void> {
        return this.service.deleteAlertById( undefined, payload.alert.id ).pipe(
            initialize( (): void => this.facade.startAlertLoader() ),
            finalize( (): void => this.facade.stopAlertLoader() ),
            map( (): void => this.deleteAlertComplete( ctx, payload.alert ) ),
        )
    }

    private deleteAlertComplete (
        ctx: StateContext<AlertStateModel>,
        alert: AlertModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `alerts.notifications.delete.title`,
            `alerts.notifications.delete.message`,
            this.alertIcon,
            this.buildTranslationArgs( alert ),
        )
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (alert: AlertModel): object {
        return {
            title: alert?.title,
            status: alert?.status?.label,
        }
    }

    protected refreshPage (ctx: StateContext<AlertStateModel>): void {
        const page: PageModel<AlertModel> | undefined = ctx.getState().alerts.element
        this.facade.fetchAlertsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<AlertStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                alerts: this.buildErrorMessage( ctx.getState().alerts, error ),
            } )
        }

        return of()
    }
}
