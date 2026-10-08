import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, EMPTY, finalize, map, Observable, pipe, switchMap, tap } from 'rxjs'
import { ToastMessageOptions } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { SelectedProjectStoreModel } from '@pages/projects/data/model/selected-project-store.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, reportError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

type CurrentMovementsKey = keyof SelectedProjectStoreModel['currentMovements']
type StatusKey = keyof SelectedProjectStoreModel['status']

interface CurrentPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface CurrentMovementsContentsRequest {
    projectId: string | undefined
    movementIds: string[]
}

const buildToast = (error: ErrorModel): ToastMessageOptions => ({
    severity: 'error',
    summary: error.title,
    detail: error.message,
    icon: 'pi pi-exclamation-triangle',
    closable: true,
})

const currentMovementsBlock = (linkedToActivity: boolean): SelectedProjectStoreModel['currentMovements']['withActivity'] =>
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

export const SelectedProjectStore = signalStore(
    withState<SelectedProjectStoreModel>( defaultSelectedProjectStore ),
    withProfileScope<SelectedProjectStoreModel>( defaultSelectedProjectStore ),
    withProps( () => ({
        movementApi: inject( MovementApi ),
        alertApi: inject( AlertApi ),
        participantApi: inject( ParticipantApi ),
        uiFacade: inject( UiFacade ),
    }) ),
    withMethods( (store) => {
        const patchStatus = (key: StatusKey, patch: Partial<SelectedProjectStoreModel['status'][StatusKey]>): void => {
            patchState( store, (state: SelectedProjectStoreModel) => ({
                status: { ...state.status, [key]: { ...state.status[key], ...patch } },
            }) )
        }

        const patchCurrentMovements = (
            key: CurrentMovementsKey,
            update: (block: SelectedProjectStoreModel['currentMovements'][CurrentMovementsKey]) => SelectedProjectStoreModel['currentMovements'][CurrentMovementsKey],
        ): void => {
            patchState( store, (state: SelectedProjectStoreModel) => ({
                currentMovements: { ...state.currentMovements, [key]: update( state.currentMovements[key] ) },
            }) )
        }

        const statusFetcher = <T>(key: StatusKey, source: (projectId: string | undefined) => Observable<T>) =>
            rxMethod<string | undefined>( pipe(
                switchMap( (projectId: string | undefined): Observable<T> => source( projectId ).pipe(
                    initialize( (): void => patchStatus( key, { loading: true } ) ),
                    finalize( (): void => patchStatus( key, { loading: false } ) ),
                    catchError( (error: ErrorModel): Observable<never> => {
                        if (error.status === 503) {
                            reportError( store.uiFacade, error )
                        } else {
                            patchStatus( key, { error: buildToast( error ) } )
                        }
                        return EMPTY
                    } ),
                ) ),
                tap( (element: T): void => patchStatus( key, { element: element as never } ) ),
            ) )

        const currentMovementsContents = (key: CurrentMovementsKey) => rxMethod<CurrentMovementsContentsRequest>( pipe(
            switchMap( (request: CurrentMovementsContentsRequest): Observable<PairModel<MovementContentModel[]>[]> =>
                store.movementApi.findMovementsContents(
                    request.projectId,
                    request.movementIds,
                    store.currentMovements[key].params.currentMovements(),
                ).pipe(
                    catchError( (error: ErrorModel): Observable<never> => {
                        reportError( store.uiFacade, error )
                        return EMPTY
                    } ),
                ),
            ),
            tap( (contents: PairModel<MovementContentModel[]>[]): void => patchCurrentMovements( key, (block) => {
                if (!block.element) return block
                return {
                    ...block,
                    element: {
                        ...block.element,
                        content: MovementHelper.rebuildPageWithContent( block.element.content, contents ),
                    },
                }
            } ) ),
        ) )

        const fetchWithoutActivityContents = currentMovementsContents( 'withoutActivity' )
        const fetchWithActivityContents = currentMovementsContents( 'withActivity' )

        const currentMovementsPage = (key: CurrentMovementsKey, fetchContents: typeof fetchWithActivityContents) =>
            rxMethod<CurrentPageRequest>( pipe(
                switchMap( (request: CurrentPageRequest): Observable<{ request: CurrentPageRequest, page: PageModel<MovementModel> }> =>
                    store.movementApi.findMovements(
                        request.projectId,
                        request.pageNumber,
                        request.pageSize,
                        store.currentMovements[key].params(),
                    ).pipe(
                        initialize( (): void => patchCurrentMovements( key, (block) => StateHelper.updatePageLoader( block, true ) ) ),
                        finalize( (): void => patchCurrentMovements( key, (block) => StateHelper.updatePageLoader( block, false ) ) ),
                        catchError( (error: ErrorModel): Observable<never> => {
                            if (error.status === 503) {
                                reportError( store.uiFacade, error )
                            } else {
                                patchCurrentMovements( key, (block) => PageStateHelper.withError( block, error ) )
                            }
                            return EMPTY
                        } ),
                        map( (page: PageModel<MovementModel>) => ({ request, page }) ),
                    ),
                ),
                tap( ({ request, page }): void => {
                    patchCurrentMovements( key, (block) => ({ ...block, element: page }) )
                    if (page.content.length > 0) {
                        fetchContents( {
                            projectId: request.projectId,
                            movementIds: page.content.map( (movement: MovementModel): string => movement.id ),
                        } )
                    }
                } ),
            ) )

        return {
            fetchParticipantsStatus: statusFetcher<ProjectStatusModel>( 'participants', (projectId: string | undefined) => store.movementApi.findParticipantsStatus( projectId ) ),
            fetchVehiclesStatus: statusFetcher<VehicleStatusModel>( 'vehicles', (projectId: string | undefined) => store.movementApi.findVehiclesStatus( projectId ) ),

            fetchParticipantsBirthdays: rxMethod<string | undefined>( pipe(
                switchMap( (projectId: string | undefined): Observable<ParticipantModel[]> =>
                    store.participantApi.findParticipantsBirthdays( projectId ).pipe(
                        catchError( (error: ErrorModel): Observable<never> => {
                            reportError( store.uiFacade, error )
                            return EMPTY
                        } ),
                    ),
                ),
                tap( (participants: ParticipantModel[]): void => patchState( store, { birthdays: participants } ) ),
            ) ),

            fetchCurrentMovementsPageWithoutActivity: currentMovementsPage( 'withoutActivity', fetchWithoutActivityContents ),
            fetchCurrentMovementsPageWithActivity: currentMovementsPage( 'withActivity', fetchWithActivityContents ),
            fetchCurrentMovementsWithoutActivityContents: fetchWithoutActivityContents,
            fetchCurrentMovementsWithActivityContents: fetchWithActivityContents,

            fetchCurrentAlertsPage: rxMethod<CurrentPageRequest>( pipe(
                switchMap( (request: CurrentPageRequest): Observable<PageModel<AlertModel>> => store.alertApi.findAlerts(
                    request.projectId,
                    request.pageNumber,
                    request.pageSize,
                    store.alerts.params(),
                ).pipe(
                    catchError( (error: ErrorModel): Observable<never> => {
                        if (error.status === 503) {
                            reportError( store.uiFacade, error )
                        } else {
                            patchState( store, (state: SelectedProjectStoreModel) => ({
                                alerts: PageStateHelper.withError( state.alerts, error ),
                            }) )
                        }
                        return EMPTY
                    } ),
                ) ),
                tap( (page: PageModel<AlertModel>): void => patchState( store, (state: SelectedProjectStoreModel) => ({
                    alerts: { ...state.alerts, element: page },
                }) ) ),
            ) ),
        }
    } ),
)
