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
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper'

interface ActivitiesPageRequest extends CumulativePageRequest {
    projectId: string | undefined
}

interface ActivityMovementsPageRequest extends ActivitiesPageRequest {
    id: string
}

const defaultActivityStore: ActivityStoreModel = {
    sectionErrors: {},
    activities: PageStateHelper.initial<ActivityPageParamsModel, ActivityModel>( {
        resetSearch: false,
        q: undefined,
        isVisible: undefined,
        isAvailable: undefined,
        at: undefined,
    } ),
    movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        isCurrent: false,
        isVisible: undefined,
        hasActivity: undefined,
        type: undefined,
        from: undefined,
        to: undefined,
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
 * Purpose: Détient l'état des activités.
 * Scope: Possède les données des pages et ressources d'activités avec leurs drapeaux de chargement et d'erreur, et les récupère via l'api des activités.
 * Limits: Atteint via la facade des activités ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const ActivityStore = signalStore(
    withState<ActivityStoreModel>( defaultActivityStore ),
    withProfileScope<ActivityStoreModel>( defaultActivityStore ),
    withMethods( (store, api = inject( ActivityApi ), movementApi = inject( MovementApi ), errors = inject( ErrorReporter )) => ({
        fetchActivitiesPage: pageFetcher( store, 'activities', (request: ActivitiesPageRequest, params: ActivityPageParamsModel) =>
            api.findActivities( request.projectId, request.page, request.size, params ), errors, { merge: CumulativePageHelper.merge } ),
        updateActivitiesPageSearchParams: paramsUpdater( store, 'activities' ),
        updateActivityMovementsPageSearchParams: paramsUpdater( store, 'movements' ),
        fetchActivityMovementsContents: movementContentsFetcher( store, movementApi ),
    }) ),
    withMethods( (store, api = inject( ActivityApi ), errors = inject( ErrorReporter )) => ({
        fetchActivityMovementsPage: pageFetcher( store, 'movements', (request: ActivityMovementsPageRequest, params: MovementPageParamsModel) =>
            api.findActivityMovements( request.projectId, request.id, request.page, request.size, params ), errors, {
            merge: CumulativePageHelper.merge,
            after: contentsRequester( store.fetchActivityMovementsContents ),
        } ),
    }) ),
)
