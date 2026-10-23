import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'

/**
 * Purpose: Public entry point of the activity domain for pages, components and guards.
 * Scope: Exposes the activity store as signals, forwards its queries and runs the activity commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class ActivityFacade extends GenericProjectElementFacade {
    private readonly api: ActivityApi = inject( ActivityApi )

    private readonly store: InstanceType<typeof ActivityStore> = inject( ActivityStore )

    public readonly activitiesPage: Signal<PageModel<ActivityModel> | undefined> = this.store.activities.element
    public readonly activitiesPageLoading: Signal<boolean> = this.store.activities.loading
    public readonly activitiesPageSilentLoading: Signal<boolean> = this.store.activities.silentLoading
    public readonly activitiesPageError: Signal<ToastMessageOptions | undefined> = this.store.activities.error
    private readonly activitiesPageResetSearch: Signal<boolean> = this.store.activities.params.resetSearch
    public readonly activitiesPageTextSearchedParam: Signal<string | undefined> = this.store.activities.params.textSearched
    public readonly activitiesPageDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.activities.params.dateTimeSearched() ),
    )
    public readonly activitiesPageAvailabilitySearchedParam: Signal<boolean | undefined> = this.store.activities.params.availabilitySearched
    public readonly activitiesPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.activities.params.visibilitySearched

    public readonly activityMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element
    public readonly activityMovementsPageLoading: Signal<boolean> = this.store.movements.loading
    public readonly activityMovementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading
    public readonly activityMovementsPageError: Signal<ToastMessageOptions | undefined> = this.store.movements.error
    public readonly activityMovementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch
    public readonly activityMovementsPageTypeSearchedParam: Signal<string | undefined> = this.store.movements.params.typeSearched
    public readonly activityMovementsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.startDateTimeSearched() ),
    )
    public readonly activityMovementsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.endDateTimeSearched() ),
    )
    public readonly activityMovementsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.movements.params.visibilitySearched

    public readonly availabilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = this.translated( this.store.metadata.availabilities )
    public readonly visibilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = this.translated( this.store.metadata.visibilities )

    private translated (items: Signal<SelectItem<boolean | undefined>[]>): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] => items().map(
            (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }),
        ) )
    }

    public fetchActivitiesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.activitiesPageResetSearch() ? 0 : pageNumber
        this.store.fetchActivitiesPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
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
            this.store.updateActivitiesPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                availabilitySearched: availabilitySearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } )
        }
    }

    public fetchActivityMovementsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.activityMovementsPageResetSearch() ? 0 : pageNumber
        this.store.fetchActivityMovementsPage( { projectId: this.selectedProjectId(), id: id, pageNumber: index, pageSize: pageSize } )
    }

    public fetchActivityMovementsContent (movementIds: string[]): void {
        this.store.fetchActivityMovementsContents( { projectId: this.selectedProjectId(), movementIds: movementIds } )
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
            this.store.updateActivityMovementsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                currentMovements: false,
                linkedToActivity: true,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } )
        }
    }

    public fetchActivity (id: string): Observable<ActivityModel> {
        return this.api.findActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
        )
    }

    public createActivity (activity: ActivityDto): Observable<ActivityModel> {
        return this.api.createActivity( this.selectedProjectId(), activity ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (created: ActivityModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateActivity (id: string, activity: ActivityDto): Observable<ActivityModel> {
        return this.api.updateActivityById( this.selectedProjectId(), id, activity ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (updated: ActivityModel): void => this.onCommandSuccess( 'edit', updated ) ),
        )
    }

    public disableActivity (id: string): Observable<ActivityModel> {
        return this.api.disableActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: ActivityModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableActivity (id: string): Observable<ActivityModel> {
        return this.api.enableActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: ActivityModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteActivity (activity: ActivityModel): Observable<void> {
        return this.api.deleteActivityById( undefined, activity.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', activity ) ),
        )
    }

    private onCommandSuccess (command: string, activity: ActivityModel): void {
        this.notifySuccess( `activities.notifications.${ command }`, 'pi pi-users', { name: activity?.name } )

        const page: PageModel<ActivityModel> | undefined = this.activitiesPage()
        this.fetchActivitiesPage( page?.pageNumber, page?.pageSize )
    }
}
