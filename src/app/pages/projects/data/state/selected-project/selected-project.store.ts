import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, EMPTY, finalize, map, Observable, pipe, switchMap, tap } from 'rxjs'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { SelectedProjectStoreModel } from '@pages/projects/data/model/selected-project-store.model'
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { initialize } from '@shared/helpers/rx.helper'
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { contentsSection, elementFetcher, MovementContentsRequest, pageFetcher, StoreRef, trackSectionError } from '@shared/helpers/store/paged-store.methods'
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
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper'

type CurrentMovementsKey = keyof SelectedProjectStoreModel['isCurrent']
type StatusKey = keyof SelectedProjectStoreModel['status']
type MovementsBlock = SelectedProjectStoreModel['isCurrent'][CurrentMovementsKey]
type Ref = StoreRef<SelectedProjectStoreModel>

interface CurrentPageRequest extends CumulativePageRequest {
    projectId: string | undefined
}

const currentMovementsBlock = (hasActivity: boolean): MovementsBlock =>
    PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        isCurrent: true,
        hasActivity: hasActivity,
        isVisible: undefined,
        type: undefined,
        from: undefined,
        to: undefined,
    } )

const defaultSelectedProjectStore: SelectedProjectStoreModel = {
    sectionErrors: {},
    status: {
        participants: { element: undefined, loading: false, error: undefined },
        vehicles: { element: undefined, loading: false, error: undefined },
    },
    alerts: PageStateHelper.initial<AlertPageParamsModel, AlertModel>( {
        resetSearch: false,
        q: undefined,
        status: AlertStatusEnum.IN_PROGRESS,
        isVisible: true,
        from: undefined,
        to: undefined,
        sort: '-criticality',
    } ),
    overdue: PageStateHelper.initial<ParticipantPageParamsModel, ParticipantModel>( {
        resetSearch: false,
        isVisible: true,
        status: PresenceStatusEnum.OVERDUE,
        q: undefined,
        onSite: true,
        sort: 'endAvailability',
    } ),
    birthdays: { element: undefined, loading: false, error: undefined },
    isCurrent: {
        withoutActivity: currentMovementsBlock( false ),
        withActivity: currentMovementsBlock( true ),
    },
}

function patchStatus (store: Ref, key: StatusKey, patch: Partial<SelectedProjectStoreModel['status'][StatusKey]>): void {
    patchState( store, (state: SelectedProjectStoreModel) => ({
        status: { ...state.status, [ key ]: { ...state.status[ key ], ...patch } },
    }) )
}

function patchCurrentMovements (store: Ref, key: CurrentMovementsKey, update: (block: MovementsBlock) => MovementsBlock): void {
    patchState( store, (state: SelectedProjectStoreModel) => ({
        isCurrent: { ...state.isCurrent, [ key ]: update( state.isCurrent[ key ] ) },
    }) )
}

function currentMovementsSlice (store: Ref, key: CurrentMovementsKey): PageSlice<MovementsBlock> {
    return {
        read: (): MovementsBlock => store.isCurrent()[ key ],
        write: (block: MovementsBlock): void => patchCurrentMovements( store, key, (): MovementsBlock => block ),
    }
}

function statusFetcher<T> (store: Ref, key: StatusKey, source: (projectId: string | undefined) => Observable<T>): RxMethod<string | undefined> {
    return rxMethod<string | undefined>( pipe(
        switchMap( (projectId: string | undefined): Observable<T> => source( projectId ).pipe(
            initialize( (): void => patchStatus( store, key, { loading: true } ) ),
            finalize( (): void => patchStatus( store, key, { loading: false } ) ),
            catchError( (error: ErrorModel): Observable<never> => reportStatusError( store, key, error ) ),
        ) ),
        tap( (element: T): void => patchStatus( store, key, { element: element as never } ) ),
    ) )
}

function reportStatusError (store: Ref, key: StatusKey, error: ErrorModel): Observable<never> {
    patchStatus( store, key, { error: PageStateHelper.toNotification( error ) } )
    return EMPTY
}

function currentMovementsContents (store: Ref, key: CurrentMovementsKey, movementApi: MovementApi): RxMethod<MovementContentsRequest> {
    return rxMethod<MovementContentsRequest>( pipe(
        switchMap( (request: MovementContentsRequest): Observable<PairModel<MovementContentModel[]>[]> => movementApi.findMovementsContents(
            request.projectId,
            request.movementIds,
            store.isCurrent()[ key ].params.isCurrent,
        ).pipe( trackSectionError( store, contentsSection( key ) ) ) ),
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
    fetchContents: (request: MovementContentsRequest) => void,
): RxMethod<CurrentPageRequest> {
    return rxMethod<CurrentPageRequest>( pipe(
        switchMap( (request: CurrentPageRequest): Observable<{ request: CurrentPageRequest, page: PageModel<MovementModel> }> =>
            fetchCurrentMovements( store, key, movementApi, request ),
        ),
        tap( ({ request, page }: { request: CurrentPageRequest, page: PageModel<MovementModel> }): void => {
            patchCurrentMovements( store, key, (block: MovementsBlock): MovementsBlock => ({ ...block, element: CumulativePageHelper.merge( block.element, page, request ) }) )
            requestContents( fetchContents, request, page )
        } ),
    ) )
}

function fetchCurrentMovements (
    store: Ref,
    key: CurrentMovementsKey,
    movementApi: MovementApi,
    request: CurrentPageRequest,
): Observable<{ request: CurrentPageRequest, page: PageModel<MovementModel> }> {
    const params: MovementPageParamsModel = store.isCurrent()[ key ].params
    return movementApi.findMovements( request.projectId, request.page, request.size, params ).pipe(
        trackPage( currentMovementsSlice( store, key ) ),
        map( (page: PageModel<MovementModel>) => ({ request, page }) ),
    )
}

function requestContents (fetchContents: (request: MovementContentsRequest) => void, request: CurrentPageRequest, page: PageModel<MovementModel>): void {
    if (page.content.length > 0) {
        fetchContents( { projectId: request.projectId, movementIds: page.content.map( (movement: MovementModel): string => movement.id ) } )
    }
}

/**
 * Purpose: Holds the selected project state.
 * Scope: Owns the data of the selected project pages and resources with their loading and error flags, and fetches them through the selected project api.
 * Limits: Reached through the selected project facade; it does not format data or notify the user of command results.
 */
export const SelectedProjectStore = signalStore(
    withState<SelectedProjectStoreModel>( defaultSelectedProjectStore ),
    withProfileScope<SelectedProjectStoreModel>( defaultSelectedProjectStore ),
    withMethods( (store, movementApi = inject( MovementApi ), participantApi = inject( ParticipantApi )) => ({
        fetchParticipantsStatus: statusFetcher<ProjectStatusModel>( store, 'participants', (projectId: string | undefined) => movementApi.findParticipantsStatus( projectId ) ),
        fetchVehiclesStatus: statusFetcher<VehicleStatusModel>( store, 'vehicles', (projectId: string | undefined) => movementApi.findVehiclesStatus( projectId ) ),
        fetchParticipantsBirthdays: elementFetcher( store, 'birthdays', (projectId: string | undefined) => participantApi.findParticipantsBirthdays( projectId ) ),
        fetchCurrentMovementsWithoutActivityContents: currentMovementsContents( store, 'withoutActivity', movementApi ),
        fetchCurrentMovementsWithActivityContents: currentMovementsContents( store, 'withActivity', movementApi ),
    }) ),
    withMethods( (store, movementApi = inject( MovementApi ), alertApi = inject( AlertApi ), participantApi = inject( ParticipantApi ), errors = inject( ErrorReporter )) => ({
        fetchCurrentMovementsPageWithoutActivity: currentMovementsPage( store, 'withoutActivity', movementApi, store.fetchCurrentMovementsWithoutActivityContents ),
        fetchCurrentMovementsPageWithActivity: currentMovementsPage( store, 'withActivity', movementApi, store.fetchCurrentMovementsWithActivityContents ),
        fetchOverduePage: pageFetcher( store, 'overdue', (request: CurrentPageRequest, params: ParticipantPageParamsModel) =>
            participantApi.findParticipants( request.projectId, request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge } ),
        fetchCurrentAlertsPage: pageFetcher( store, 'alerts', (request: CurrentPageRequest, params: AlertPageParamsModel) =>
            alertApi.findAlerts( request.projectId, request.page, request.size, params ), errors ),
    }) ),
)
