import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CommunicationStoreModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-store.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { elementFetcher, metadataFetcher, trackElement } from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { AlertModel } from '@shared/models/model/alert.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { MovementModel } from '@shared/models/model/movement.model'

interface CommunicationRequest {
    projectId: string | undefined
    id: string
}

interface SearchRequest {
    projectId: string | undefined
    q: string | undefined
}

const defaultCommunication: ElementRequestInformationModel<CommunicationModel> = {
    element: undefined,
    loading: false,
    error: undefined,
}

const defaultCommunicationStore: CommunicationStoreModel = {
    sectionErrors: {},
    communication: defaultCommunication,
    metadata: {
        searchedMovements: [],
        searchedAlerts: [],
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
    withMethods( (store, api = inject( CommunicationApi )) => ({
        fetchCommunication: elementFetcher( store, 'communication', (request: CommunicationRequest) =>
            api.findCommunicationById( request.projectId, request.id )),
        resetCommunication: (): void => patchState( store, { communication: defaultCommunication } ),
    }) ),
    withMethods( (store, api = inject( CommunicationApi ), datePipe = inject( DateFormatPipe )) => ({
        searchMovements: metadataFetcher<CommunicationStoreModel, 'searchedMovements', SearchRequest, MovementModel[]>(
            store, 'searchedMovements',
            (request: SearchRequest) => api.searchMovements( request.projectId, request.q ).pipe( trackElement( store, 'communication' ) ),
            (movements: MovementModel[]): SelectOptionModel<MovementModel>[] => movements.map( (movement: MovementModel): SelectOptionModel<MovementModel> => MovementHelper.toActivitySelectItem( movement, datePipe ) ),
        ),
        searchAlerts: metadataFetcher<CommunicationStoreModel, 'searchedAlerts', SearchRequest, AlertModel[]>(
            store, 'searchedAlerts',
            (request: SearchRequest) => api.searchAlerts( request.projectId, request.q ).pipe( trackElement( store, 'communication' ) ),
            (alerts: AlertModel[]): SelectOptionModel<AlertModel>[] => alerts.map( (alert: AlertModel): SelectOptionModel<AlertModel> => AlertHelper.toSelectItem( alert, datePipe ) ),
        ),
    }) ),
)
