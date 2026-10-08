import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, EMPTY, finalize, map, Observable, pipe, switchMap, tap } from 'rxjs'
import { ToastMessageOptions } from 'primeng/api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { SelectedProjectStoreModel } from '@pages/projects/data/model/selected-project-store.model'
import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { ErrorSink, initialize, notifyOnError, reportError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { MovementContentsRequest, pageFetcher, StoreRef } from '@shared/helpers/store/paged-store.methods'
import { PageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { PageModel } from '@shared/models/model/page.model'
import { PairModel } from '@shared/models/model/pair.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

type CurrentMovementsKey = keyof SelectedProjectStoreModel['currentMovements']
type StatusKey = keyof SelectedProjectStoreModel['status']
type MovementsBlock = SelectedProjectStoreModel['currentMovements'][CurrentMovementsKey]
type Ref = StoreRef<SelectedProjectStoreModel>

interface CurrentPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

const currentMovementsBlock = (linkedToActivity: boolean): MovementsBlock =>
    PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        currentMovements: true,
        linkedToActivity: linkedToActivity,
        visibilitySearched: undefined,
        typeSearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } )

const defaultSelectedProjectStore: SelectedProjectStoreModel = {
    status: {
        participants: { element: undefined, loading: false, error: undefined },
        vehicles: { element: undefined, loading: false, error: undefined },
    },
    alerts: PageStateHelper.initial<AlertPageParamsModel, AlertModel>( {
        resetSearch: false,
        textSearched: undefined,
        statusSearched: AlertStatusEnum.IN_PROGRESS,
        visibilitySearched: true,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    birthdays: [],
    currentMovements: {
        withoutActivity: currentMovementsBlock( false ),
        withActivity: currentMovementsBlock( true ),
    },
}

const buildToast = (error: ErrorModel): ToastMessageOptions => ({
    severity: 'error',
    summary: error.title,
    detail: error.message,
    icon: 'pi pi-exclamation-triangle',
    closable: true,
})

function patchStatus (store: Ref, key: StatusKey, patch: Partial<SelectedProjectStoreModel['status'][StatusKey]>): void {
    patchState( store, (state: SelectedProjectStoreModel) => ({
        status: { ...state.status, [ key ]: { ...state.status[ key ], ...patch } },
    }) )
}

function patchCurrentMovements (store: Ref, key: CurrentMovementsKey, update: (block: MovementsBlock) => MovementsBlock): void {
    patchState( store, (state: SelectedProjectStoreModel) => ({
        currentMovements: { ...state.currentMovements, [ key ]: update( state.currentMovements[ key ] ) },
    }) )
}

function currentMovementsSlice (store: Ref, key: CurrentMovementsKey): PageSlice<MovementsBlock> {
    return {
        read: (): MovementsBlock => store.currentMovements()[ key ],
        write: (block: MovementsBlock): void => patchCurrentMovements( store, key, (): MovementsBlock => block ),
    }
}

function statusFetcher<T> (store: Ref, key: StatusKey, source: (projectId: string | undefined) => Observable<T>, errors: ErrorSink): RxMethod<string | undefined> {
    return rxMethod<string | undefined>( pipe(
        switchMap( (projectId: string | undefined): Observable<T> => source( projectId ).pipe(
            initialize( (): void => patchStatus( store, key, { loading: true } ) ),
            finalize( (): void => patchStatus( store, key, { loading: false } ) ),
            catchError( (error: ErrorModel): Observable<never> => reportStatusError( store, key, errors, error ) ),
        ) ),
        tap( (element: T): void => patchStatus( store, key, { element: element as never } ) ),
    ) )
}

function reportStatusError (store: Ref, key: StatusKey, errors: ErrorSink, error: ErrorModel): Observable<never> {
    if (error.status === 503) {
        reportError( errors, error )
    } else {
        patchStatus( store, key, { error: buildToast( error ) } )
    }
    return EMPTY
}

function currentMovementsContents (store: Ref, key: CurrentMovementsKey, movementApi: MovementApi, errors: ErrorSink): RxMethod<MovementContentsRequest> {
    return rxMethod<MovementContentsRequest>( pipe(
        switchMap( (request: MovementContentsRequest): Observable<PairModel<MovementContentModel[]>[]> => movementApi.findMovementsContents(
            request.projectId,
            request.movementIds,
            store.currentMovements()[ key ].params.currentMovements,
        ).pipe( notifyOnError( errors ) ) ),
        tap( (contents: PairModel<MovementContentModel[]>[]): void => patchCurrentMovements( store, key, (block: MovementsBlock) => mergeContents( block, contents ) ) ),
    ) )
}

function mergeContents (block: MovementsBlock, contents: PairModel<MovementContentModel[]>[]): MovementsBlock {
    if (!block.element) return block
    return { ...block, element: { ...block.element, content: MovementHelper.rebuildPageWithContent( block.element.content, contents ) } }
}

function currentMovementsPage (
    store: Ref,
    key: CurrentMovementsKey,
    movementApi: MovementApi,
    errors: ErrorSink,
    fetchContents: (request: MovementContentsRequest) => void,
): RxMethod<CurrentPageRequest> {
    return rxMethod<CurrentPageRequest>( pipe(
        switchMap( (request: CurrentPageRequest): Observable<{ request: CurrentPageRequest, page: PageModel<MovementModel> }> =>
            fetchCurrentMovements( store, key, movementApi, errors, request ),
        ),
        tap( ({ request, page }: { request: CurrentPageRequest, page: PageModel<MovementModel> }): void => {
            patchCurrentMovements( store, key, (block: MovementsBlock): MovementsBlock => ({ ...block, element: page }) )
            requestContents( fetchContents, request, page )
        } ),
    ) )
}

function fetchCurrentMovements (
    store: Ref,
    key: CurrentMovementsKey,
    movementApi: MovementApi,
    errors: ErrorSink,
    request: CurrentPageRequest,
): Observable<{ request: CurrentPageRequest, page: PageModel<MovementModel> }> {
    const params: MovementPageParamsModel = store.currentMovements()[ key ].params
    return movementApi.findMovements( request.projectId, request.pageNumber, request.pageSize, params ).pipe(
        trackPage( errors, currentMovementsSlice( store, key ) ),
        map( (page: PageModel<MovementModel>) => ({ request, page }) ),
    )
}

function requestContents (fetchContents: (request: MovementContentsRequest) => void, request: CurrentPageRequest, page: PageModel<MovementModel>): void {
    if (page.content.length > 0) {
        fetchContents( { projectId: request.projectId, movementIds: page.content.map( (movement: MovementModel): string => movement.id ) } )
    }
}

function fetchParticipantsBirthdays (store: Ref, participantApi: ParticipantApi, errors: ErrorSink): RxMethod<string | undefined> {
    return rxMethod<string | undefined>( pipe(
        switchMap( (projectId: string | undefined): Observable<ParticipantModel[]> => participantApi.findParticipantsBirthdays( projectId ).pipe(
            catchError( (error: ErrorModel): Observable<never> => {
                reportError( errors, error )
                return EMPTY
            } ),
        ) ),
        tap( (participants: ParticipantModel[]): void => patchState( store, { birthdays: participants } ) ),
    ) )
}

/**
 * Purpose: Holds the selected project state.
 * Scope: Owns the data of the selected project pages and resources with their loading and error flags, and fetches them through the selected project api.
 * Limits: Reached through the selected project facade; it does not format data or notify the user of command results.
 */
export const SelectedProjectStore = signalStore(
    withState<SelectedProjectStoreModel>( defaultSelectedProjectStore ),
    withProfileScope<SelectedProjectStoreModel>( defaultSelectedProjectStore ),
    withMethods( (store, movementApi = inject( MovementApi ), participantApi = inject( ParticipantApi ), errors = inject( ErrorReporter )) => ({
        fetchParticipantsStatus: statusFetcher<ProjectStatusModel>( store, 'participants', (projectId: string | undefined) => movementApi.findParticipantsStatus( projectId ), errors ),
        fetchVehiclesStatus: statusFetcher<VehicleStatusModel>( store, 'vehicles', (projectId: string | undefined) => movementApi.findVehiclesStatus( projectId ), errors ),
        fetchParticipantsBirthdays: fetchParticipantsBirthdays( store, participantApi, errors ),
        fetchCurrentMovementsWithoutActivityContents: currentMovementsContents( store, 'withoutActivity', movementApi, errors ),
        fetchCurrentMovementsWithActivityContents: currentMovementsContents( store, 'withActivity', movementApi, errors ),
    }) ),
    withMethods( (store, movementApi = inject( MovementApi ), alertApi = inject( AlertApi ), errors = inject( ErrorReporter )) => ({
        fetchCurrentMovementsPageWithoutActivity: currentMovementsPage( store, 'withoutActivity', movementApi, errors, store.fetchCurrentMovementsWithoutActivityContents ),
        fetchCurrentMovementsPageWithActivity: currentMovementsPage( store, 'withActivity', movementApi, errors, store.fetchCurrentMovementsWithActivityContents ),
        fetchCurrentAlertsPage: pageFetcher( store, 'alerts', (request: CurrentPageRequest, params: AlertPageParamsModel) =>
            alertApi.findAlerts( request.projectId, request.pageNumber, request.pageSize, params ), errors ),
    }) ),
)
