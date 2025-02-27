import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ActivityModel } from '../../../../shared/util-model/model/activity.model'
import { ActivityDto } from '../dto/activity.dto'
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
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
import { ActivityState } from './activity.state'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

@Injectable()
export class ActivityFacade extends GenericEventElementFacade {
    public get activitiesPage (): Signal<PageModel<ActivityModel> | undefined> {
        return this.ngStore.selectSignal( ActivityState.activitiesPage )
    }

    public get activitiesPageLoading (): Signal<boolean> {
        return computed( (): boolean => this.ngStore.selectSignal( ActivityState.activitiesPageLoading )() || this.registryFacade.contextEventLoading() )
    }

    public get activitiesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageSilentLoading )
    }

    public get activitiesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageError )
    }

    public get activitiesPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageTextSearchedParam )
    }

    public get activitiesPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ActivityState.activitiesPageDateTimeSearchedParam )() ),
        )
    }

    public get activitiesPageAvailabilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageAvailabilitySearchedParam )
    }

    public get activitiesPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageVisibilitySearchedParam )
    }

    public get activityMovementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPage )
    }

    public get activityMovementsPageLoading (): Signal<boolean> {
        return computed( (): boolean =>
            this.ngStore.selectSignal( ActivityState.activityMovementsPageLoading )() || this.registryFacade.contextEventLoading(),
        )
    }

    public get activityMovementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageSilentLoading )
    }

    public get activityMovementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageError )
    }

    public get activityMovementsPageMovementTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageMovementTypeSearchedParam )
    }

    public get activityMovementsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ActivityState.activityMovementsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get activityMovementsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ActivityState.activityMovementsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get activityMovementsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageVisibilitySearchedParam )
    }

    public get activity (): Signal<ActivityModel | undefined> {
        return this.ngStore.selectSignal( ActivityState.activity )
    }

    public get activity$ (): Observable<ActivityModel | undefined> {
        return this.ngStore.select( ActivityState.activity )
    }

    public get activityLoading (): Signal<boolean> {
        return computed( (): boolean => this.ngStore.selectSignal( ActivityState.activityLoading )() || this.registryFacade.contextEventLoading() )
    }

    public get availabilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ActivityState.availabilitiesMetadata )().map(
                (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                    ...status,
                    label: this.translateService.instant( status.label! ),
                }),
            ),
        )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ActivityState.visibilitiesMetadata )().map(
                (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                    ...status,
                    label: this.translateService.instant( status.label! ),
                }),
            ),
        )
    }

    public startActivitiesPageLoader (): void {
        this.ngStore.dispatch( StartActivitiesPageLoader )
    }

    public stopActivitiesPageLoader (): void {
        this.ngStore.dispatch( StopActivitiesPageLoader )
    }

    public fetchActivitiesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchActivitiesPage( eventId, pageNumber, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        availabilitySearched: boolean | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (textSearched !== this.activitiesPageTextSearchedParam()) {
            this.ngStore.dispatch( new InputActivitiesPageTextSearched( textSearched ) )
        }

        if (dateTimeSearched !== this.activitiesPageDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputActivitiesPageDateTimeSearched( dateTimeSearched ) )
        }

        if (availabilitySearched !== this.activitiesPageAvailabilitySearchedParam()) {
            this.ngStore.dispatch( new SelectActivitiesPageAvailabilitySearched( availabilitySearched ) )
        }

        if (visibilitySearched !== this.activitiesPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectActivitiesPageVisibilitySearched( visibilitySearched ) )
        }
    }

    public startActivityMovementsPageLoader (): void {
        this.ngStore.dispatch( StartActivityMovementsPageLoader )
    }

    public stopActivityMovementsPageLoader (): void {
        this.ngStore.dispatch( StopActivityMovementsPageLoader )
    }

    public fetchActivityMovementsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchActivityMovementsPage( eventId, id, pageNumber, pageSize, force ) )
    }

    public fetchActivityMovementsContent (
        movementIds: string[],
        eventId: string | undefined,
    ): void {
        this.ngStore.dispatch( new FetchActivityMovementsContents( eventId, movementIds ) )
    }

    public inputMovementsPageSearchParameters (
        typeSearched: string | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (typeSearched !== this.activityMovementsPageMovementTypeSearchedParam()) {
            this.ngStore.dispatch( new SelectActivityMovementsPageTypeSearched( typeSearched ) )
        }

        if (startDateTimeSearched !== this.activityMovementsPageStartDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputActivityMovementsPageStartDateTimeSearched( startDateTimeSearched ) )
        }

        if (endDateTimeSearched !== this.activityMovementsPageEndDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputActivityMovementsPageEndDateTimeSearched( endDateTimeSearched ) )
        }

        if (visibilitySearched !== this.activityMovementsPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectActivityMovementsPageVisibilitySearched( visibilitySearched ) )
        }
    }

    public startActivityLoader (): void {
        this.ngStore.dispatch( StartActivityLoader )
    }

    public stopActivityLoader (): void {
        this.ngStore.dispatch( StopActivityLoader )
    }

    public fetchActivity (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchActivity( eventId, id ) )
    }

    public resetActivity (): void {
        this.ngStore.dispatch( ResetActivity )
    }

    public createActivity (
        activity: ActivityDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateActivity> {
        this.ngStore.dispatch( new CreateActivity( eventId, activity ) )
        return this.actions$.pipe( ofActionSuccessful( CreateActivity ) )
    }

    public updateActivity (
        id: string,
        activity: ActivityDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateActivity> {
        this.ngStore.dispatch( new UpdateActivity( eventId, id, activity ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateActivity ) )
    }

    public disableActivity (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableActivity( eventId, id ) )
    }

    public enableActivity (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableActivity( eventId, id ) )
    }

    public deleteActivity (
        activity: ActivityModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new DeleteActivity( eventId, activity ) )
    }
}
