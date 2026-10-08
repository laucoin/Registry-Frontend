import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationStoreModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-store.model'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

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
    withProps( () => ({
        api: inject( CommunicationApi ),
        uiFacade: inject( UiFacade ),
        datePipe: inject( DateFormatPipe ),
    }) ),
    withMethods( (store) => {
        const trackElementLoader = <T>(source: Observable<T>): Observable<T> => source.pipe(
            initialize( (): void => patchState( store, (state: CommunicationStoreModel) => ({
                communication: StateHelper.updateElementLoader( state.communication, true ),
            }) ) ),
            finalize( (): void => patchState( store, (state: CommunicationStoreModel) => ({
                communication: StateHelper.updateElementLoader( state.communication, false ),
            }) ) ),
        )

        return {
            fetchCommunicationsPage: rxMethod<CommunicationsPageRequest>( pipe(
                switchMap( (request: CommunicationsPageRequest): Observable<PageModel<CommunicationModel>> => store.api.findCommunications(
                    request.projectId,
                    request.pageNumber,
                    request.pageSize,
                    store.communications.params(),
                ).pipe(
                    trackPage( store.uiFacade, pageSlice( store, 'communications' ) ),
                ) ),
                tap( (page: PageModel<CommunicationModel>): void => patchState( store, (state: CommunicationStoreModel) => ({
                    communications: {
                        ...state.communications,
                        params: { ...state.communications.params, resetSearch: false },
                        element: page,
                    },
                }) ) ),
            ) ),

            updateCommunicationsPageSearchParams: (params: CommunicationPageParamsModel): void => {
                patchState( store, (state: CommunicationStoreModel) => ({
                    communications: { ...state.communications, params: params },
                }) )
            },

            fetchCommunication: rxMethod<CommunicationRequest>( pipe(
                switchMap( (request: CommunicationRequest): Observable<CommunicationModel> =>
                    store.api.findCommunicationById( request.projectId, request.id ).pipe(
                        trackElementLoader,
                        notifyOnError( store.uiFacade ),
                    ),
                ),
                tap( (communication: CommunicationModel): void => patchState( store, (state: CommunicationStoreModel) => ({
                    communication: { ...state.communication, element: communication },
                }) ) ),
            ) ),

            searchMovements: rxMethod<SearchRequest>( pipe(
                switchMap( (request: SearchRequest): Observable<MovementModel[]> =>
                    store.api.searchMovements( request.projectId, request.textSearched ).pipe(
                        trackElementLoader,
                        notifyOnError( store.uiFacade ),
                    ),
                ),
                tap( (movements: MovementModel[]): void => patchState( store, (state: CommunicationStoreModel) => ({
                    metadata: {
                        ...state.metadata,
                        searchedMovements: movements.map( (movement: MovementModel): SelectItem<MovementModel> =>
                            MovementHelper.toActivitySelectItem( movement, store.datePipe ),
                        ),
                    },
                }) ) ),
            ) ),

            searchAlerts: rxMethod<SearchRequest>( pipe(
                switchMap( (request: SearchRequest): Observable<AlertModel[]> =>
                    store.api.searchAlerts( request.projectId, request.textSearched ).pipe(
                        trackElementLoader,
                        notifyOnError( store.uiFacade ),
                    ),
                ),
                tap( (alerts: AlertModel[]): void => patchState( store, (state: CommunicationStoreModel) => ({
                    metadata: {
                        ...state.metadata,
                        searchedAlerts: alerts.map( (alert: AlertModel): SelectItem<AlertModel> =>
                            AlertHelper.toSelectItem( alert, store.datePipe ),
                        ),
                    },
                }) ) ),
            ) ),

            resetCommunication: (): void => {
                patchState( store, { communication: defaultCommunication } )
            },
        }
    } ),
)
