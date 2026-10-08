import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {TranslocoService} from '@jsverse/transloco'
import { catchError, EMPTY, finalize, Observable, pipe, skip, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { AlertStoreModel } from '@pages/projects/[projectId]/alerts/data/model/alert-store.model'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, notifyOnError, reportError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

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

export const AlertStore = signalStore(
    withState<AlertStoreModel>( defaultAlertStore ),
    withProfileScope<AlertStoreModel>( defaultAlertStore, (current: AlertStoreModel): Partial<AlertStoreModel> => ({
        metadata: { ...defaultAlertStore.metadata, status: current.metadata.status },
    }) ),
    withProps( () => ({
        api: inject( AlertApi ),
        metadataApi: inject( MetadataApi ),
        registryFacade: inject( RegistryFacade ),
    }) ),
    withMethods( (store) => ({
        fetchAlertStatus: rxMethod<void>( pipe(
            switchMap( (): Observable<SelectItem<AlertStatusEnum>[]> => store.metadataApi.getAlertsStatus().pipe(
                notifyOnError( store.registryFacade ),
            ) ),
            tap( (status: SelectItem<AlertStatusEnum>[]): void => patchState( store, (state: AlertStoreModel) => ({
                metadata: { ...state.metadata, status: [ { label: '-', value: undefined }, ...status ] },
            }) ) ),
        ) ),

        fetchAlertsPage: rxMethod<AlertsPageRequest>( pipe(
            switchMap( (request: AlertsPageRequest): Observable<PageModel<AlertModel>> => store.api.findAlerts(
                request.projectId,
                request.pageNumber,
                request.pageSize,
                store.alerts.params(),
            ).pipe(
                initialize( (): void => patchState( store, (state: AlertStoreModel) => ({
                    alerts: StateHelper.updatePageLoader( state.alerts, true ),
                }) ) ),
                finalize( (): void => patchState( store, (state: AlertStoreModel) => ({
                    alerts: StateHelper.updatePageLoader( state.alerts, false ),
                }) ) ),
                catchError( (error: ErrorModel): Observable<never> => {
                    if (error.status === 503) {
                        reportError( store.registryFacade, error )
                    } else {
                        patchState( store, (state: AlertStoreModel) => ({
                            alerts: PageStateHelper.withError( state.alerts, error ),
                        }) )
                    }
                    return EMPTY
                } ),
            ) ),
            tap( (page: PageModel<AlertModel>): void => patchState( store, (state: AlertStoreModel) => ({
                alerts: {
                    ...state.alerts,
                    params: { ...state.alerts.params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) ),

        updateAlertsPageSearchParams: (params: AlertPageParamsModel): void => {
            patchState( store, (state: AlertStoreModel) => ({ alerts: { ...state.alerts, params: params } }) )
        },

        fetchAlertCommunicationsPage: rxMethod<AlertCommunicationsPageRequest>( pipe(
            switchMap( (request: AlertCommunicationsPageRequest): Observable<PageModel<CommunicationModel>> =>
                store.api.findAlertCommunications(
                    request.projectId,
                    request.id,
                    request.pageNumber,
                    request.pageSize,
                    store.communications.params(),
                ).pipe(
                    initialize( (): void => patchState( store, (state: AlertStoreModel) => ({
                        communications: StateHelper.updatePageLoader( state.communications, true ),
                    }) ) ),
                    finalize( (): void => patchState( store, (state: AlertStoreModel) => ({
                        communications: StateHelper.updatePageLoader( state.communications, false ),
                    }) ) ),
                    catchError( (error: ErrorModel): Observable<never> => {
                        if (error.status === 503) {
                            reportError( store.registryFacade, error )
                        } else {
                            patchState( store, (state: AlertStoreModel) => ({
                                communications: PageStateHelper.withError( state.communications, error ),
                            }) )
                        }
                        return EMPTY
                    } ),
                ),
            ),
            tap( (page: PageModel<CommunicationModel>): void => patchState( store, (state: AlertStoreModel) => ({
                communications: {
                    ...state.communications,
                    params: { ...state.communications.params, resetSearch: false },
                    element: page,
                },
            }) ) ),
        ) ),

        updateAlertCommunicationsPageSearchParams: (params: CommunicationPageParamsModel): void => {
            patchState( store, (state: AlertStoreModel) => ({
                communications: { ...state.communications, params: params },
            }) )
        },
    }) ),
    withHooks( {
        onInit (store): void {
            store.fetchAlertStatus()
            inject( TranslocoService ).langChanges$.pipe( skip( 1 ), takeUntilDestroyed() ).subscribe( (): void => {
                store.fetchAlertStatus()
            } )
        },
    } ),
)
