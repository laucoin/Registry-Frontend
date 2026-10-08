import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map, Observable, pipe, switchMap, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ActivityPageParamsModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { ActivityStoreModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-store.model'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

interface ActivitiesPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface ActivityMovementsPageRequest extends ActivitiesPageRequest {
    id: string
}

interface ActivityMovementsContentsRequest {
    projectId: string | undefined
    movementIds: string[]
}

const defaultActivityStore: ActivityStoreModel = {
    activities: PageStateHelper.initial<ActivityPageParamsModel, ActivityModel>( {
        resetSearch: false,
        textSearched: undefined,
        visibilitySearched: undefined,
        availabilitySearched: undefined,
        dateTimeSearched: undefined,
    } ),
    movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        currentMovements: false,
        visibilitySearched: undefined,
        linkedToActivity: undefined,
        typeSearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    metadata: {
        availabilities: [
            { label: '-', value: undefined },
            { label: 'activities.available.true', value: true },
            { label: 'activities.available.false', value: false },
        ],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'activities.visible.true', value: true },
            { label: 'activities.visible.false', value: false },
        ],
    },
}

export const ActivityStore = signalStore(
    withState<ActivityStoreModel>( defaultActivityStore ),
    withProfileScope<ActivityStoreModel>( defaultActivityStore ),
    withProps( () => ({
        api: inject( ActivityApi ),
        movementApi: inject( MovementApi ),
        uiFacade: inject( UiFacade ),
    }) ),
    withMethods( (store) => {
        const fetchMovementsContents = rxMethod<ActivityMovementsContentsRequest>( pipe(
            switchMap( (request: ActivityMovementsContentsRequest): Observable<PairModel<MovementContentModel[]>[]> =>
                store.movementApi.findMovementsContents(
                    request.projectId,
                    request.movementIds,
                    store.movements.params.currentMovements(),
                ).pipe( notifyOnError( store.uiFacade ) ),
            ),
            tap( (contents: PairModel<MovementContentModel[]>[]): void => patchState( store, (state: ActivityStoreModel) => {
                if (!state.movements.element) return state
                return {
                    movements: {
                        ...state.movements,
                        element: {
                            ...state.movements.element,
                            content: MovementHelper.rebuildPageWithContent( state.movements.element.content, contents ),
                        },
                    },
                }
            }) ),
        ) )

        return {
            fetchActivitiesPage: rxMethod<ActivitiesPageRequest>( pipe(
                switchMap( (request: ActivitiesPageRequest): Observable<PageModel<ActivityModel>> => store.api.findActivities(
                    request.projectId,
                    request.pageNumber,
                    request.pageSize,
                    store.activities.params(),
                ).pipe(
                    trackPage( store.uiFacade, pageSlice( store, 'activities' ) ),
                ) ),
                tap( (page: PageModel<ActivityModel>): void => patchState( store, (state: ActivityStoreModel) => ({
                    activities: {
                        ...state.activities,
                        params: { ...state.activities.params, resetSearch: false },
                        element: page,
                    },
                }) ) ),
            ) ),

            updateActivitiesPageSearchParams: (params: ActivityPageParamsModel): void => {
                patchState( store, (state: ActivityStoreModel) => ({ activities: { ...state.activities, params: params } }) )
            },

            fetchActivityMovementsPage: rxMethod<ActivityMovementsPageRequest>( pipe(
                switchMap( (request: ActivityMovementsPageRequest): Observable<{
                    request: ActivityMovementsPageRequest
                    page: PageModel<MovementModel>
                }> => store.api.findActivityMovements(
                    request.projectId,
                    request.id,
                    request.pageNumber,
                    request.pageSize,
                    store.movements.params(),
                ).pipe(
                    trackPage( store.uiFacade, pageSlice( store, 'movements' ) ),
                    map( (page: PageModel<MovementModel>) => ({ request, page }) ),
                ) ),
                tap( ({ request, page }): void => {
                    patchState( store, (state: ActivityStoreModel) => ({
                        movements: {
                            ...state.movements,
                            params: { ...state.movements.params, resetSearch: false },
                            element: page,
                        },
                    }) )
                    if (page.content.length > 0) {
                        fetchMovementsContents( {
                            projectId: request.projectId,
                            movementIds: page.content.map( (movement: MovementModel): string => movement.id ),
                        } )
                    }
                } ),
            ) ),

            fetchActivityMovementsContents: fetchMovementsContents,

            updateActivityMovementsPageSearchParams: (params: MovementPageParamsModel): void => {
                patchState( store, (state: ActivityStoreModel) => ({ movements: { ...state.movements, params: params } }) )
            },
        }
    } ),
)
