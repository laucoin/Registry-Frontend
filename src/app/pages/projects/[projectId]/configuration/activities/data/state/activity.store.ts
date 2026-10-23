import { inject } from '@angular/core'
import { signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ActivityPageParamsModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model'
import { ActivityStoreModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-store.model'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { contentsRequester, movementContentsFetcher, pageFetcher, paramsUpdater } from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { ActivityModel } from '@shared/models/model/activity.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'

interface ActivitiesPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface ActivityMovementsPageRequest extends ActivitiesPageRequest {
    id: string
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

/**
 * Purpose: Holds the activity state.
 * Scope: Owns the data of the activity pages and resources with their loading and error flags, and fetches them through the activity api.
 * Limits: Reached through the activity facade; it does not format data or notify the user of command results.
 */
export const ActivityStore = signalStore(
    withState<ActivityStoreModel>( defaultActivityStore ),
    withProfileScope<ActivityStoreModel>( defaultActivityStore ),
    withMethods( (store, api = inject( ActivityApi ), movementApi = inject( MovementApi ), errors = inject( ErrorReporter )) => ({
        fetchActivitiesPage: pageFetcher( store, 'activities', (request: ActivitiesPageRequest, params: ActivityPageParamsModel) =>
            api.findActivities( request.projectId, request.pageNumber, request.pageSize, params ), errors ),
        updateActivitiesPageSearchParams: paramsUpdater( store, 'activities' ),
        updateActivityMovementsPageSearchParams: paramsUpdater( store, 'movements' ),
        fetchActivityMovementsContents: movementContentsFetcher( store, movementApi, errors ),
    }) ),
    withMethods( (store, api = inject( ActivityApi ), errors = inject( ErrorReporter )) => ({
        fetchActivityMovementsPage: pageFetcher( store, 'movements', (request: ActivityMovementsPageRequest, params: MovementPageParamsModel) =>
            api.findActivityMovements( request.projectId, request.id, request.pageNumber, request.pageSize, params ), errors, {
            after: contentsRequester( store.fetchActivityMovementsContents ),
        } ),
    }) ),
)
