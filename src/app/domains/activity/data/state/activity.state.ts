import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ActivityModel } from '../../../../shared/util-model/model/activity.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import { ActivityStateModel } from '../model/activity-state.model'
import {
    CreateActivity,
    DeleteActivity,
    DisableActivity,
    EnableActivity,
    FetchActivitiesPage,
    FetchActivity,
    FetchActivityMovementsContents,
    FetchActivityMovementsPage,
    InputActivitiesPageDateTimeSearched,
    InputActivitiesPageTextSearched,
    InputActivityMovementsPageEndDateTimeSearched,
    InputActivityMovementsPageStartDateTimeSearched,
    ResetActivity,
    SelectActivitiesPageAvailabilitySearched,
    SelectActivitiesPageVisibilitySearched,
    SelectActivityMovementsPageTypeSearched,
    SelectActivityMovementsPageVisibilitySearched,
    StartActivitiesPageLoader,
    StartActivityLoader,
    StartActivityMovementsPageLoader,
    StopActivitiesPageLoader,
    StopActivityLoader,
    StopActivityMovementsPageLoader,
    UpdateActivity,
} from './activity.action'
import { ActivityService } from './activity.service'
import { ActivityFacade } from './activity.facade'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { Injectable } from '@angular/core'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { MovementService } from '../../../movement/data/state/movement.service'
import { PairModel } from '../../../../shared/util-model/model/pair.model'
import { MovementContentModel } from '../../../../shared/util-model/model/movement-content.model'
import { MovementUtil } from '../../../../shared/util-tool/util/movement.util'

const defaultActivity: ElementRequestInformationModel<ActivityModel> = {
    element: undefined,
    loading: false,
}

const defaultActivityState: ActivityStateModel = {
    activities: {
        element: undefined,
        params: {
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
            visibilitySearched: undefined,
            typeSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    activity: defaultActivity,
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
export class ActivityState extends GenericEventElementState<ActivityStateModel> {
    private readonly activityIcon: string = 'pi pi-users'

    public constructor (
        private readonly service: ActivityService,
        private readonly movementService: MovementService,
        private readonly facade: ActivityFacade,
    ) {
        super()
    }

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
    public static activityMovementsPageMovementTypeSearchedParam (state: ActivityStateModel): string | undefined {
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
    public static activity (state: ActivityStateModel): ActivityModel | undefined {
        return state.activity.element
    }

    @Selector()
    public static activityLoading (state: ActivityStateModel): boolean {
        return state.activity.loading
    }

    @Selector()
    public static availabilitiesMetadata (state: ActivityStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Selector()
    public static visibilitiesMetadata (state: ActivityStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
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
        return this.service.findActivities(
            payload.eventId,
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
                element: activityPage,
            },
        } )
    }

    @Action( InputActivitiesPageTextSearched )
    public inputActivitiesPageTextSearched (
        ctx: StateContext<ActivityStateModel>,
        payload: InputActivitiesPageTextSearched,
    ): void {
        ctx.patchState( {
            activities: {
                ...ctx.getState().activities,
                params: {
                    ...ctx.getState().activities.params,
                    textSearched: payload.textSearched,
                },
            },
        } )
    }

    @Action( InputActivitiesPageDateTimeSearched )
    public inputActivitiesPageDateTimeSearched (
        ctx: StateContext<ActivityStateModel>,
        payload: InputActivitiesPageDateTimeSearched,
    ): void {
        ctx.patchState( {
            activities: {
                ...ctx.getState().activities,
                params: {
                    ...ctx.getState().activities.params,
                    dateTimeSearched: payload.dateTimeSearched?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectActivitiesPageAvailabilitySearched )
    public selectActivitiesPageAvailabilitySearched (
        ctx: StateContext<ActivityStateModel>,
        payload: SelectActivitiesPageAvailabilitySearched,
    ): void {
        ctx.patchState( {
            activities: {
                ...ctx.getState().activities,
                params: {
                    ...ctx.getState().activities.params,
                    availabilitySearched: payload.availabilitySearched,
                },
            },
        } )
    }

    @Action( SelectActivitiesPageVisibilitySearched )
    public selectActivitiesPageVisibilitySearched (
        ctx: StateContext<ActivityStateModel>,
        payload: SelectActivitiesPageVisibilitySearched,
    ): void {
        ctx.patchState( {
            activities: {
                ...ctx.getState().activities,
                params: {
                    ...ctx.getState().activities.params,
                    visibilitySearched: payload.visibilitySearched,
                },
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
        return this.service.findActivityMovements(
            payload.eventId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startActivityMovementsPageLoader() ),
            finalize( (): void => this.facade.stopActivityMovementsPageLoader() ),
            map( (movementsPage: PageModel<MovementModel>): void => this.fetchActivityMovementsPageComplete(
                ctx,
                payload.eventId,
                movementsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.movementsPageError( ctx, error ) ),
        )
    }

    private fetchActivityMovementsPageComplete (
        ctx: StateContext<ActivityStateModel>,
        eventId: string | undefined,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                element: movementsPage,
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchActivityMovementsContent(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
                eventId,
            )
        }
    }

    @Action( FetchActivityMovementsContents )
    public fetchActivityMovementsContents (
        ctx: StateContext<ActivityStateModel>,
        payload: FetchActivityMovementsContents,
    ): Observable<void> {
        return this.movementService.findMovementsContent(
            payload.eventId,
            payload.movementIds,
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

    @Action( SelectActivityMovementsPageTypeSearched )
    public selectActivityMovementsPageTypeSearched (
        ctx: StateContext<ActivityStateModel>,
        payload: SelectActivityMovementsPageTypeSearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    typeSearched: payload.typeSearched,
                },
            },
        } )
    }

    @Action( InputActivityMovementsPageStartDateTimeSearched )
    public inputActivityMovementsPageStartDateTimeSearched (
        ctx: StateContext<ActivityStateModel>,
        payload: InputActivityMovementsPageStartDateTimeSearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    startDateTimeSearched: payload.startDateTimeSearched?.toISOString(),
                },
            },
        } )
    }

    @Action( InputActivityMovementsPageEndDateTimeSearched )
    public inputActivityMovementsPageEndDateTimeSearched (
        ctx: StateContext<ActivityStateModel>,
        payload: InputActivityMovementsPageEndDateTimeSearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    endDateTimeSearched: payload.endDateTimeSearched?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectActivityMovementsPageVisibilitySearched )
    public selectActivityMovementsPageVisibilitySearched (
        ctx: StateContext<ActivityStateModel>,
        payload: SelectActivityMovementsPageVisibilitySearched,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    visibilitySearched: payload.visibilitySearched,
                },
            },
        } )
    }

    @Action( StartActivityLoader )
    public startActivityLoader (ctx: StateContext<ActivityStateModel>): void {
        ctx.patchState( {
            activity: StateUtil.updateElementLoader( ctx.getState().activity, true ),
        } )
    }

    @Action( StopActivityLoader )
    public stopActivityLoader (ctx: StateContext<ActivityStateModel>): void {
        ctx.patchState( {
            activity: StateUtil.updateElementLoader( ctx.getState().activity, false ),
        } )
    }

    @Action( FetchActivity )
    public fetchActivity (ctx: StateContext<ActivityStateModel>, payload: FetchActivity): Observable<void> {
        return this.service.findActivityById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startActivityLoader() ),
            finalize( (): void => this.facade.stopActivityLoader() ),
            map( (activity: ActivityModel): void => this.fetchActivityComplete( ctx, activity ) ),
        )
    }

    private fetchActivityComplete (
        ctx: StateContext<ActivityStateModel>,
        activity: ActivityModel,
    ): void {
        ctx.patchState( {
            activity: {
                ...ctx.getState().activity,
                element: activity,
            },
        } )
    }

    @Action( ResetActivity )
    public resetActivity (ctx: StateContext<ActivityStateModel>): void {
        ctx.patchState( {
            activity: defaultActivity,
        } )
    }

    @Action( CreateActivity )
    public createActivity (ctx: StateContext<ActivityStateModel>, payload: CreateActivity): Observable<void> {
        return this.service.createActivity( payload.eventId, payload.activity ).pipe(
            initialize( (): void => this.facade.startActivityLoader() ),
            finalize( (): void => this.facade.stopActivityLoader() ),
            map( (activity: ActivityModel): void => this.createActivityComplete(
                ctx,
                payload.eventId,
                activity,
            ) ),
        )
    }

    private createActivityComplete (
        ctx: StateContext<ActivityStateModel>,
        eventId: string | undefined,
        activity: ActivityModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'activities.notifications.create.title',
            'activities.notifications.create.message',
            this.activityIcon,
            this.buildTranslationArgs( activity ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( UpdateActivity )
    public updateActivity (ctx: StateContext<ActivityStateModel>, payload: UpdateActivity): Observable<void> {
        return this.service.updateActivityById( payload.eventId, payload.id, payload.activity ).pipe(
            initialize( (): void => this.facade.startActivityLoader() ),
            finalize( (): void => this.facade.stopActivityLoader() ),
            map( (activity: ActivityModel): void => this.updateActivityComplete(
                ctx,
                payload.eventId,
                activity,
            ) ),
        )
    }

    private updateActivityComplete (
        ctx: StateContext<ActivityStateModel>,
        eventId: string | undefined,
        activity: ActivityModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'activities.notifications.edit.title',
            'activities.notifications.edit.message',
            this.activityIcon,
            this.buildTranslationArgs( activity ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DisableActivity )
    public disableActivity (
        ctx: StateContext<ActivityStateModel>,
        payload: DisableActivity,
    ): Observable<void> {
        return this.service.disableActivityById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startActivityLoader() ),
            finalize( (): void => this.facade.stopActivityLoader() ),
            map( (activity: ActivityModel): void => this.disableActivityComplete(
                ctx,
                payload.eventId,
                activity,
            ) ),
        )
    }

    private disableActivityComplete (
        ctx: StateContext<ActivityStateModel>,
        eventId: string | undefined,
        activity: ActivityModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'activities.notifications.disable.title',
            'activities.notifications.disable.message',
            this.activityIcon,
            this.buildTranslationArgs( activity ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( EnableActivity )
    public enableActivity (ctx: StateContext<ActivityStateModel>, payload: EnableActivity): Observable<void> {
        return this.service.enableActivityById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startActivityLoader() ),
            finalize( (): void => this.facade.stopActivityLoader() ),
            map( (activity: ActivityModel): void => this.enableActivityComplete(
                ctx,
                payload.eventId,
                activity,
            ) ),
        )
    }

    private enableActivityComplete (
        ctx: StateContext<ActivityStateModel>,
        eventId: string | undefined,
        activity: ActivityModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'activities.notifications.enable.title',
            'activities.notifications.enable.message',
            this.activityIcon,
            this.buildTranslationArgs( activity ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DeleteActivity )
    public deleteActivity (ctx: StateContext<ActivityStateModel>, payload: DeleteActivity): Observable<void> {
        return this.service.deleteActivityById( undefined, payload.activity.id ).pipe(
            initialize( (): void => this.facade.startActivityLoader() ),
            finalize( (): void => this.facade.stopActivityLoader() ),
            map( (): void => this.deleteActivityComplete(
                ctx,
                payload.eventId,
                payload.activity,
            ) ),
        )
    }

    private deleteActivityComplete (
        ctx: StateContext<ActivityStateModel>,
        eventId: string | undefined,
        activity: ActivityModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'activities.notifications.delete.title',
            'activities.notifications.delete.message',
            this.activityIcon,
            this.buildTranslationArgs( activity ),
        )
        this.refreshPage( ctx, eventId )
    }

    private buildTranslationArgs (activity: ActivityModel): object {
        return {
            name: activity?.name,
        }
    }

    protected refreshPage (ctx: StateContext<ActivityStateModel>, eventId: string | undefined): void {
        const page: PageModel<ActivityModel> | undefined = ctx.getState().activities.element
        this.facade.fetchActivitiesPage( page?.pageNumber, page?.pageSize, true, eventId )
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
