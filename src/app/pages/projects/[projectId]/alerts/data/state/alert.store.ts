import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementStore } from '@shared/helpers/state/generic-project-element.store'
import { initialize } from '@shared/helpers/rx.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { inject, Injectable } from '@angular/core'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '@shared/models/model/error.model'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStoreModel } from '@pages/projects/[projectId]/alerts/data/model/alert-store.model'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import {
    FetchAlertCommunicationsPage,
    FetchAlertsPage,
    FetchAlertStatus,
    ResetAlertState,
    StartAlertCommunicationsPageLoader,
    StartAlertsPageLoader,
    StopAlertCommunicationsPageLoader,
    StopAlertsPageLoader,
    UpdateAlertCommunicationsPageSearchParams,
    UpdateAlertsPageSearchParams,
} from '@pages/projects/[projectId]/alerts/data/state/alert.action'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'

const defaultAlertStore: AlertStoreModel = {
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

@State<AlertStoreModel>( {
    name: 'alert',
    defaults: defaultAlertStore,
} )
@Injectable()
export class AlertStore extends GenericProjectElementStore<AlertStoreModel> implements NgxsOnInit {
    private readonly api: AlertApi = inject( AlertApi )
    private readonly metadataApi: MetadataApi = inject( MetadataApi )
    private readonly facade: AlertFacade = inject( AlertFacade )

    public ngxsOnInit (): void {
        this.facade.fetchAlertStatus()
    }

    @Selector()
    public static alertsPage (state: AlertStoreModel): PageModel<AlertModel> | undefined {
        return state.alerts.element
    }

    @Selector()
    public static alertsPageLoading (state: AlertStoreModel): boolean {
        return state.alerts.loading
    }

    @Selector()
    public static alertsPageError (state: AlertStoreModel): ToastMessageOptions | undefined {
        return state.alerts.error
    }

    @Selector()
    public static alertsPageSilentLoading (state: AlertStoreModel): boolean {
        return state.alerts.silentLoading
    }

    @Selector()
    public static alertsPageResetSearch (state: AlertStoreModel): boolean {
        return state.alerts.params.resetSearch
    }

    @Selector()
    public static alertsPageTextSearchedParam (state: AlertStoreModel): string | undefined {
        return state.alerts.params.textSearched
    }

    @Selector()
    public static alertsPageStatusSearchedParam (state: AlertStoreModel): AlertStatusEnum | undefined {
        return state.alerts.params.statusSearched
    }

    @Selector()
    public static alertsPageVisibilitySearchedParam (state: AlertStoreModel): boolean | undefined {
        return state.alerts.params.visibilitySearched
    }

    @Selector()
    public static alertsPageStartDateTimeSearchedParam (state: AlertStoreModel): string | undefined {
        return state.alerts.params.startDateTimeSearched
    }

    @Selector()
    public static alertsPageEndDateTimeSearchedParam (state: AlertStoreModel): string | undefined {
        return state.alerts.params.endDateTimeSearched
    }

    @Selector()
    public static alertCommunicationsPage (state: AlertStoreModel): PageModel<CommunicationModel> | undefined {
        return state.communications.element
    }

    @Selector()
    public static alertCommunicationsPageLoading (state: AlertStoreModel): boolean {
        return state.communications.loading
    }

    @Selector()
    public static alertCommunicationsPageError (state: AlertStoreModel): ToastMessageOptions | undefined {
        return state.communications.error
    }

    @Selector()
    public static alertCommunicationsPageSilentLoading (state: AlertStoreModel): boolean {
        return state.communications.silentLoading
    }

    @Selector()
    public static alertCommunicationsPageResetSearch (state: AlertStoreModel): boolean {
        return state.communications.params.resetSearch
    }

    @Selector()
    public static alertCommunicationsPageTextSearchedParam (state: AlertStoreModel): string | undefined {
        return state.communications.params.textSearched
    }

    @Selector()
    public static alertCommunicationsPageVisibilitySearchedParam (state: AlertStoreModel): boolean | undefined {
        return state.communications.params.visibilitySearched
    }

    @Selector()
    public static alertCommunicationsPageStartDateTimeSearchedParam (state: AlertStoreModel): string | undefined {
        return state.communications.params.startDateTimeSearched
    }

    @Selector()
    public static alertCommunicationsPageEndDateTimeSearchedParam (state: AlertStoreModel): string | undefined {
        return state.communications.params.endDateTimeSearched
    }

    @Selector()
    public static alertStatusMetadata (state: AlertStoreModel): SelectItem<AlertStatusEnum | undefined>[] {
        return state._metadata.status
    }

    @Selector()
    public static visibilitiesMetadata (state: AlertStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetAlertState )
    public resetAlertState (ctx: StateContext<AlertStoreModel>): void {
        ctx.setState( {
            ...defaultAlertStore,
            _metadata: {
                ...defaultAlertStore._metadata,
                status: ctx.getState()._metadata.status,
            },
        } )
    }

    @Action( FetchAlertStatus )
    public fetchAlertStatus (ctx: StateContext<AlertStoreModel>): Observable<void> {
        return this.metadataApi.getAlertsStatus().pipe(
            map( (status: SelectItem<AlertStatusEnum>[]): void => this.fetchAlertStatusComplete( ctx, status ) ),
        )
    }

    private fetchAlertStatusComplete (
        ctx: StateContext<AlertStoreModel>,
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
    public startAlertsPageLoader (ctx: StateContext<AlertStoreModel>): void {
        ctx.patchState( {
            alerts: StateHelper.updatePageLoader( ctx.getState().alerts, true ),
        } )
    }

    @Action( StopAlertsPageLoader )
    public stopAlertsPageLoader (ctx: StateContext<AlertStoreModel>): void {
        ctx.patchState( {
            alerts: StateHelper.updatePageLoader( ctx.getState().alerts, false ),
        } )
    }

    @Action( FetchAlertsPage )
    public fetchAlertsPage (
        ctx: StateContext<AlertStoreModel>,
        payload: FetchAlertsPage,
    ): Observable<void> {
        return this.api.findAlerts(
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
        ctx: StateContext<AlertStoreModel>,
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
        ctx: StateContext<AlertStoreModel>,
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
    public startAlertCommunicationsPageLoader (ctx: StateContext<AlertStoreModel>): void {
        ctx.patchState( {
            communications: StateHelper.updatePageLoader( ctx.getState().communications, true ),
        } )
    }

    @Action( StopAlertCommunicationsPageLoader )
    public stopAlertCommunicationsPageLoader (ctx: StateContext<AlertStoreModel>): void {
        ctx.patchState( {
            communications: StateHelper.updatePageLoader( ctx.getState().communications, false ),
        } )
    }

    @Action( FetchAlertCommunicationsPage )
    public fetchAlertCommunicationsPage (
        ctx: StateContext<AlertStoreModel>,
        payload: FetchAlertCommunicationsPage,
    ): Observable<void> {
        return this.api.findAlertCommunications(
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
        ctx: StateContext<AlertStoreModel>,
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
        ctx: StateContext<AlertStoreModel>,
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
        ctx: StateContext<AlertStoreModel>,
        payload: UpdateAlertCommunicationsPageSearchParams,
    ): void {
        ctx.patchState( {
            communications: {
                ...ctx.getState().communications,
                params: payload.params,
            },
        } )
    }

    protected refreshPage (ctx: StateContext<AlertStoreModel>): void {
        const page: PageModel<AlertModel> | undefined = ctx.getState().alerts.element
        this.facade.fetchAlertsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<AlertStoreModel>, error: ErrorModel): Observable<void> {
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
