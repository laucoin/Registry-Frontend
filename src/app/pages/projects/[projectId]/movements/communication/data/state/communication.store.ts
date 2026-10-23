import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { SelectItem } from 'primeng/api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationStoreModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-store.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { elementFetcher, metadataFetcher, pageFetcher, paramsUpdater, trackElement } from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { AlertModel } from '@shared/models/model/alert.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { MovementModel } from '@shared/models/model/movement.model'

interface CommunicationsPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface CommunicationRequest {
    projectId: string | undefined
    id: string
}

interface SearchRequest {
    projectId: string | undefined
    textSearched: string | undefined
}

const defaultCommunication: ElementRequestInformationModel<CommunicationModel> = {
    element: undefined,
    loading: false,
}

const defaultCommunicationStore: CommunicationStoreModel = {
    communications: PageStateHelper.initial<CommunicationPageParamsModel, CommunicationModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    communication: defaultCommunication,
    metadata: {
        searchedMovements: [],
        searchedAlerts: [],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'communications.visible.true', value: true },
            { label: 'communications.visible.false', value: false },
        ],
    },
}

/**
 * Purpose: Holds the communication state.
 * Scope: Owns the data of the communication pages and resources with their loading and error flags, and fetches them through the communication api.
 * Limits: Reached through the communication facade; it does not format data or notify the user of command results.
 */
export const CommunicationStore = signalStore(
    withState<CommunicationStoreModel>( defaultCommunicationStore ),
    withProfileScope<CommunicationStoreModel>( defaultCommunicationStore ),
    withMethods( (store, api = inject( CommunicationApi ), errors = inject( ErrorReporter )) => ({
        fetchCommunicationsPage: pageFetcher( store, 'communications', (request: CommunicationsPageRequest, params: CommunicationPageParamsModel) =>
            api.findCommunications( request.projectId, request.pageNumber, request.pageSize, params ), errors ),
        updateCommunicationsPageSearchParams: paramsUpdater( store, 'communications' ),
        fetchCommunication: elementFetcher( store, 'communication', (request: CommunicationRequest) =>
            api.findCommunicationById( request.projectId, request.id ), errors ),
        resetCommunication: (): void => patchState( store, { communication: defaultCommunication } ),
    }) ),
    withMethods( (store, api = inject( CommunicationApi ), errors = inject( ErrorReporter ), datePipe = inject( DateFormatPipe )) => ({
        searchMovements: metadataFetcher<CommunicationStoreModel, 'searchedMovements', SearchRequest, MovementModel[]>(
            store, 'searchedMovements',
            (request: SearchRequest) => api.searchMovements( request.projectId, request.textSearched ).pipe( trackElement( store, 'communication' ) ),
            errors,
            (movements: MovementModel[]): SelectItem<MovementModel>[] => movements.map( (movement: MovementModel): SelectItem<MovementModel> => MovementHelper.toActivitySelectItem( movement, datePipe ) ),
        ),
        searchAlerts: metadataFetcher<CommunicationStoreModel, 'searchedAlerts', SearchRequest, AlertModel[]>(
            store, 'searchedAlerts',
            (request: SearchRequest) => api.searchAlerts( request.projectId, request.textSearched ).pipe( trackElement( store, 'communication' ) ),
            errors,
            (alerts: AlertModel[]): SelectItem<AlertModel>[] => alerts.map( (alert: AlertModel): SelectItem<AlertModel> => AlertHelper.toSelectItem( alert, datePipe ) ),
        ),
    }) ),
)
