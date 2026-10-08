import { inject } from '@angular/core'
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { SelectItem } from 'primeng/api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { AlertStoreModel } from '@pages/projects/[projectId]/alerts/data/model/alert-store.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { refreshOnLanguageChange } from '@shared/helpers/store/language-refresh'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { metadataFetcher, pageFetcher, paramsUpdater, withEmptyOption } from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'

interface AlertsPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface AlertCommunicationsPageRequest extends AlertsPageRequest {
    id: string
}

const defaultAlertStore: AlertStoreModel = {
    alerts: PageStateHelper.initial<AlertPageParamsModel, AlertModel>( {
        resetSearch: false,
        textSearched: undefined,
        statusSearched: undefined,
        visibilitySearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    communications: PageStateHelper.initial<CommunicationPageParamsModel, CommunicationModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    metadata: {
        status: [],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'alerts.visible.true', value: true },
            { label: 'alerts.visible.false', value: false },
        ],
    },
}

/**
 * Purpose: Holds the alert state.
 * Scope: Owns the data of the alert pages and resources with their loading and error flags, and fetches them through the alert api.
 * Limits: Reached through the alert facade; it does not format data or notify the user of command results.
 */
export const AlertStore = signalStore(
    withState<AlertStoreModel>( defaultAlertStore ),
    withProfileScope<AlertStoreModel>( defaultAlertStore, (current: AlertStoreModel): Partial<AlertStoreModel> => ({
        metadata: { ...defaultAlertStore.metadata, status: current.metadata.status },
    }) ),
    withMethods( (store, api = inject( AlertApi ), metadataApi = inject( MetadataApi ), errors = inject( ErrorReporter )) => ({
        fetchAlertStatus: metadataFetcher<AlertStoreModel, 'status', void, SelectItem<AlertStatusEnum>[]>(
            store, 'status', () => metadataApi.getAlertsStatus(), errors, withEmptyOption,
        ),
        fetchAlertsPage: pageFetcher( store, 'alerts', (request: AlertsPageRequest, params: AlertPageParamsModel) =>
            api.findAlerts( request.projectId, request.pageNumber, request.pageSize, params ), errors ),
        updateAlertsPageSearchParams: paramsUpdater( store, 'alerts' ),
        fetchAlertCommunicationsPage: pageFetcher( store, 'communications', (request: AlertCommunicationsPageRequest, params: CommunicationPageParamsModel) =>
            api.findAlertCommunications( request.projectId, request.id, request.pageNumber, request.pageSize, params ), errors ),
        updateAlertCommunicationsPageSearchParams: paramsUpdater( store, 'communications' ),
    }) ),
    withHooks( {
        onInit: (store): void => refreshOnLanguageChange( store.fetchAlertStatus ),
    } ),
)
