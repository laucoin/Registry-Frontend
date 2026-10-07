import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { GenericProjectElementState } from '@shared/helpers/state/generic-project-element.state'
import { initialize } from '@shared/helpers/util/rx.util'
import { ActivityStateModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-state.model'
import {
    FetchActivitiesPage,
    FetchActivityMovementsContents,
    FetchActivityMovementsPage,
    ResetActivityState,
    StartActivitiesPageLoader,
    StartActivityMovementsPageLoader,
    StopActivitiesPageLoader,
    StopActivityMovementsPageLoader,
    UpdateActivitiesPageSearchParams,
    UpdateActivityMovementsPageSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.action'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { StateUtil } from '@shared/helpers/state/state.util'
import { inject, Injectable } from '@angular/core'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementUtil } from '@shared/helpers/util/movement.util'

const defaultActivityState: ActivityStateModel = {
    activities: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            visibilitySearched: undefined,
            availabilitySearched: undefined,
            dateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    movements: {
        element: undefined,
        params: {
            resetSearch: false,
            currentMovements: false,
            visibilitySearched: undefined,
            linkedToActivity: undefined,
            typeSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    _metadata: {
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

@State<ActivityStateModel>( {
    name: 'activity',
    defaults: defaultActivityState,
} )
@Injectable()
export class ActivityState extends GenericProjectElementState<ActivityStateModel> {
    private readonly api: ActivityApi = inject( ActivityApi )
    private readonly movementApi: MovementApi = inject( MovementApi )
    private readonly facade: ActivityFacade = inject( ActivityFacade )

    @Selector()
    public static activitiesPage (state: ActivityStateModel): PageModel<ActivityModel> | undefined {
        return state.activities.element
    }

    @Selector()
    public static activitiesPageLoading (state: ActivityStateModel): boolean {
        return state.activities.loading
    }

    @Selector()
    public static activitiesPageError (state: ActivityStateModel): ToastMessageOptions | undefined {
        return state.activities.error
    }

    @Selector()
    public static activitiesPageSilentLoading (state: ActivityStateModel): boolean {
        return state.activities.silentLoading
    }

    @Selector()
    public static activitiesPageResetSearch (state: ActivityStateModel): boolean {
        return state.activities.params.resetSearch
    }

    @Selector()
    public static activitiesPageTextSearchedParam (state: ActivityStateModel): string | undefined {
        return state.activities.params.textSearched
    }

    @Selector()
    public static activitiesPageDateTimeSearchedParam (state: ActivityStateModel): string | undefined {
        return state.activities.params.dateTimeSearched
    }

    @Selector()
    public static activitiesPageAvailabilitySearchedParam (state: ActivityStateModel): boolean | undefined {
        return state.activities.params.availabilitySearched
    }

    @Selector()
    public static activitiesPageVisibilitySearchedParam (state: ActivityStateModel): boolean | undefined {
        return state.activities.params.visibilitySearched
    }

    @Selector()
    public static activityMovementsPage (state: ActivityStateModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static activityMovementsPageLoading (state: ActivityStateModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static activityMovementsPageError (state: ActivityStateModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static activityMovementsPageSilentLoading (state: ActivityStateModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static activityMovementsPageResetSearch (state: ActivityStateModel): boolean {
        return state.movements.params.resetSearch
    }

    @Selector()
    public static activityMovementsPageTypeSearchedParam (state: ActivityStateModel): string | undefined {
        return state.movements.params.typeSearched
    }

    @Selector()
    public static activityMovementsPageStartDateTimeSearchedParam (state: ActivityStateModel): string | undefined {
        return state.movements.params.startDateTimeSearched
    }

    @Selector()
    public static activityMovementsPageEndDateTimeSearchedParam (state: ActivityStateModel): string | undefined {
        return state.movements.params.endDateTimeSearched
    }

    @Selector()
    public static activityMovementsPageVisibilitySearchedParam (state: ActivityStateModel): boolean | undefined {
        return state.movements.params.visibilitySearched
    }

    @Selector()
    public static availabilitiesMetadata (state: ActivityStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Selector()
    public static visibilitiesMetadata (state: ActivityStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetActivityState )
    public resetActivityState (ctx: StateContext<ActivityStateModel>): void {
        ctx.setState( defaultActivityState )
    }

    @Action( StartActivitiesPageLoader )
    public startActivitiesPageLoader (ctx: StateContext<ActivityStateModel>): void {
        ctx.patchState( {
            activities: StateUtil.updatePageLoader( ctx.getState().activities, true ),
        } )
    }

    @Action( StopActivitiesPageLoader )
    public stopActivitiesPageLoader (ctx: StateContext<ActivityStateModel>): void {
        ctx.patchState( {
            activities: StateUtil.updatePageLoader( ctx.getState().activities, false ),
        } )
    }

    @Action( FetchActivitiesPage )
    public fetchActivitiesPage (
        ctx: StateContext<ActivityStateModel>,
        payload: FetchActivitiesPage,
    ): Observable<void> {
        return this.api.findActivities(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().activities.params,
        ).pipe(
            initialize( (): void => this.facade.startActivitiesPageLoader() ),
            finalize( (): void => this.facade.stopActivitiesPageLoader() ),
            map( (activityPage: PageModel<ActivityModel>): void => this.fetchActivitiesPageComplete(
                ctx,
                activityPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchActivitiesPageComplete (
        ctx: StateContext<ActivityStateModel>,
        activityPage: PageModel<ActivityModel>,
    ): void {
        ctx.patchState( {
            activities: {
                ...ctx.getState().activities,
                params: {
                    ...ctx.getState().activities.params,
                    resetSearch: false,
                },
                element: activityPage,
            },
        } )
    }

    @Action( UpdateActivitiesPageSearchParams )
    public updateActivitiesPageSearchParams (
        ctx: StateContext<ActivityStateModel>,
        payload: UpdateActivitiesPageSearchParams,
    ): void {
        ctx.patchState( {
            activities: {
                ...ctx.getState().activities,
                params: payload.params,
            },
        } )
    }

    @Action( StartActivityMovementsPageLoader )
    public startActivityMovementsPageLoader (ctx: StateContext<ActivityStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopActivityMovementsPageLoader )
    public stopActivityMovementsPageLoader (ctx: StateContext<ActivityStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchActivityMovementsPage )
    public fetchActivityMovementsPage (
        ctx: StateContext<ActivityStateModel>,
        payload: FetchActivityMovementsPage,
    ): Observable<void> {
        return this.api.findActivityMovements(
            payload.projectId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startActivityMovementsPageLoader() ),
            finalize( (): void => this.facade.stopActivityMovementsPageLoader() ),
            map( (movementsPage: PageModel<MovementModel>): void => this.fetchActivityMovementsPageComplete(
                ctx,
                movementsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.movementsPageError( ctx, error ) ),
        )
    }

    private fetchActivityMovementsPageComplete (
        ctx: StateContext<ActivityStateModel>,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    resetSearch: false,
                },
                element: movementsPage,
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchActivityMovementsContent(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
            )
        }
    }

    @Action( FetchActivityMovementsContents )
    public fetchActivityMovementsContents (
        ctx: StateContext<ActivityStateModel>,
        payload: FetchActivityMovementsContents,
    ): Observable<void> {
        return this.movementApi.findMovementsContents(
            payload.projectId,
            payload.movementIds,
            ctx.getState().movements.params.currentMovements,
        ).pipe(
            map( (contents: PairModel<MovementContentModel[]>[]): void => this.fetchActivityMovementsContentsComplete(
                ctx,
                contents,
            ) ),
        )
    }

    private fetchActivityMovementsContentsComplete (
        ctx: StateContext<ActivityStateModel>,
        contents: PairModel<MovementContentModel[]>[],
    ): void {
        if (!ctx.getState().movements.element) {
            return
        }

        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                element: {
                    ...ctx.getState().movements.element!,
                    content: MovementUtil.rebuildPageWithContent( ctx.getState().movements.element!.content, contents ),
                },
            },
        } )
    }

    @Action( UpdateActivityMovementsPageSearchParams )
    public updateActivityMovementsPageSearchParams (
        ctx: StateContext<ActivityStateModel>,
        payload: UpdateActivityMovementsPageSearchParams,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: payload.params,
            },
        } )
    }

    protected refreshPage (ctx: StateContext<ActivityStateModel>): void {
        const page: PageModel<ActivityModel> | undefined = ctx.getState().activities.element
        this.facade.fetchActivitiesPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<ActivityStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                activities: this.buildErrorMessage( ctx.getState().activities, error ),
            } )
        }

        return of()
    }

    protected movementsPageError (ctx: StateContext<ActivityStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                movements: this.buildErrorMessage( ctx.getState().movements, error ),
            } )
        }
        return of()
    }
}
