import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import {
    FetchActivitiesPage,
    FetchActivityMovementsContents,
    FetchActivityMovementsPage,
    StartActivitiesPageLoader,
    StartActivityMovementsPageLoader,
    StopActivitiesPageLoader,
    StopActivityMovementsPageLoader,
    UpdateActivitiesPageSearchParams,
    UpdateActivityMovementsPageSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateUtil } from '@shared/helpers/util/date.util'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/util/rx.util'

@Injectable()
export class ActivityFacade extends GenericProjectElementFacade {
    private readonly api: ActivityApi = inject( ActivityApi )

    public get activitiesPage (): Signal<PageModel<ActivityModel> | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPage )
    }

    public get activitiesPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPageLoading )
    }

    public get activitiesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPageSilentLoading )
    }

    public get activitiesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPageError )
    }

    private get activitiesPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPageResetSearch )
    }

    public get activitiesPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPageTextSearchedParam )
    }

    public get activitiesPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ActivityStore.activitiesPageDateTimeSearchedParam )() ),
        )
    }

    public get activitiesPageAvailabilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPageAvailabilitySearchedParam )
    }

    public get activitiesPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activitiesPageVisibilitySearchedParam )
    }

    public get activityMovementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activityMovementsPage )
    }

    public get activityMovementsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityStore.activityMovementsPageLoading )
    }

    public get activityMovementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityStore.activityMovementsPageSilentLoading )
    }

    public get activityMovementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activityMovementsPageError )
    }

    public get activityMovementsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ActivityStore.activityMovementsPageResetSearch )
    }

    public get activityMovementsPageTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activityMovementsPageTypeSearchedParam )
    }

    public get activityMovementsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ActivityStore.activityMovementsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get activityMovementsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ActivityStore.activityMovementsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get activityMovementsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ActivityStore.activityMovementsPageVisibilitySearchedParam )
    }

    public get availabilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ActivityStore.availabilitiesMetadata )().map(
                (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                    ...status,
                    label: this.translateService.instant( status.label! ),
                }),
            ),
        )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ActivityStore.visibilitiesMetadata )().map(
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
        this.ngStore.dispatch( new FetchActivitiesPage( this.selectedProjectId(), index, pageSize, force ) )
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
        this.ngStore.dispatch( new FetchActivityMovementsPage( this.selectedProjectId(), id, index, pageSize, force ) )
    }

    public fetchActivityMovementsContent (movementIds: string[]): void {
        this.ngStore.dispatch( new FetchActivityMovementsContents( this.selectedProjectId(), movementIds ) )
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
                currentMovements: false,
                linkedToActivity: true,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public fetchActivity (id: string): Observable<ActivityModel> {
        return this.api.findActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createActivity (activity: ActivityDto): Observable<ActivityModel> {
        return this.api.createActivity( this.selectedProjectId(), activity ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: ActivityModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateActivity (id: string, activity: ActivityDto): Observable<ActivityModel> {
        return this.api.updateActivityById( this.selectedProjectId(), id, activity ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: ActivityModel): void => this.onCommandSuccess( 'edit', updated ) ),
        )
    }

    public disableActivity (id: string): Observable<ActivityModel> {
        return this.api.disableActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: ActivityModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableActivity (id: string): Observable<ActivityModel> {
        return this.api.enableActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: ActivityModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteActivity (activity: ActivityModel): Observable<void> {
        return this.api.deleteActivityById( undefined, activity.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', activity ) ),
        )
    }

    private onCommandSuccess (command: string, activity: ActivityModel): void {
        this.notifySuccess( `activities.notifications.${ command }`, 'pi pi-users', { name: activity?.name } )

        const page: PageModel<ActivityModel> | undefined = this.activitiesPage()
        this.fetchActivitiesPage( page?.pageNumber, page?.pageSize, true )
    }
}
