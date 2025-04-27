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
    ResetActivity,
    StartActivitiesPageLoader,
    StartActivityLoader,
    StartActivityMovementsPageLoader,
    StopActivitiesPageLoader,
    StopActivityLoader,
    StopActivityMovementsPageLoader,
    UpdateActivitiesPageSearchParams,
    UpdateActivity,
    UpdateActivityMovementsPageSearchParams,
} from './activity.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ActionCompletion, ofActionCompleted, ofActionSuccessful } from '@ngxs/store'
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
        return this.ngStore.selectSignal( ActivityState.activitiesPageLoading )
    }

    public get activitiesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageSilentLoading )
    }

    public get activitiesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageError )
    }

    private get activitiesPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityState.activitiesPageResetSearch )
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
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageLoading )
    }

    public get activityMovementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageSilentLoading )
    }

    public get activityMovementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageError )
    }

    public get activityMovementsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageResetSearch )
    }

    public get activityMovementsPageTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ActivityState.activityMovementsPageTypeSearchedParam )
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
        return this.ngStore.selectSignal( ActivityState.activityLoading )
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
    ): void {
        const index: number | undefined = this.activitiesPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchActivitiesPage( this.selectedEventId(), index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        availabilitySearched: boolean | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.activitiesPageTextSearchedParam() != textSearched
                                     || this.activitiesPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.activitiesPageAvailabilitySearchedParam() != availabilitySearched
                                     || this.activitiesPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateActivitiesPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                availabilitySearched: availabilitySearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } ) )
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
    ): void {
        const index: number | undefined = this.activityMovementsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchActivityMovementsPage( this.selectedEventId(), id, index, pageSize, force ) )
    }

    public fetchActivityMovementsContent (movementIds: string[]): void {
        this.ngStore.dispatch( new FetchActivityMovementsContents( this.selectedEventId(), movementIds ) )
    }

    public inputMovementsPageSearchParameters (
        typeSearched: string | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.activityMovementsPageTypeSearchedParam() != typeSearched
                                     || this.activityMovementsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.activityMovementsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()
                                     || this.activityMovementsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateActivityMovementsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startActivityLoader (): void {
        this.ngStore.dispatch( StartActivityLoader )
    }

    public stopActivityLoader (): void {
        this.ngStore.dispatch( StopActivityLoader )
    }

    public fetchActivity (id: string): void {
        this.ngStore.dispatch( new FetchActivity( this.selectedEventId(), id ) )
    }

    public resetActivity (): void {
        this.ngStore.dispatch( ResetActivity )
    }

    public createActivity (activity: ActivityDto): Observable<CreateActivity> {
        this.ngStore.dispatch( new CreateActivity( this.selectedEventId(), activity ) )
        return this.actions$.pipe( ofActionSuccessful( CreateActivity ) )
    }

    public updateActivity (
        id: string,
        activity: ActivityDto,
    ): Observable<UpdateActivity> {
        this.ngStore.dispatch( new UpdateActivity( this.selectedEventId(), id, activity ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateActivity ) )
    }

    public disableActivity (id: string): Observable<ActionCompletion<DisableActivity>> {
        this.ngStore.dispatch( new DisableActivity( this.selectedEventId(), id ) )

        return this.actions$.pipe( ofActionCompleted( DisableActivity ) )
    }

    public enableActivity (id: string): Observable<ActionCompletion<EnableActivity>> {
        this.ngStore.dispatch( new EnableActivity( this.selectedEventId(), id ) )

        return this.actions$.pipe( ofActionCompleted( EnableActivity ) )
    }

    public deleteActivity (activity: ActivityModel): Observable<ActionCompletion<DeleteActivity>> {
        this.ngStore.dispatch( new DeleteActivity( this.selectedEventId(), activity ) )

        return this.actions$.pipe( ofActionCompleted( DeleteActivity ) )
    }
}
