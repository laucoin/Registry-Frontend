import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model'
import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'

/**
 * Purpose: Point d'entrée public du domaine des activités pour les pages, composants et guards.
 * Scope: Expose le store des activités sous forme de signals, relaie ses requêtes et exécute les commandes d'activité avec leurs notifications.
 * Limits: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class ActivityFacade extends GenericProjectElementFacade {
    private readonly api: ActivityApi = inject( ActivityApi )

    private readonly store: InstanceType<typeof ActivityStore> = inject( ActivityStore )

    public readonly activitiesPage: Signal<PageModel<ActivityModel> | undefined> = this.store.activities.element
    public readonly activitiesPageLoading: Signal<boolean> = this.store.activities.loading
    public readonly activitiesPageSilentLoading: Signal<boolean> = this.store.activities.silentLoading
    public readonly activitiesPageError: Signal<NotificationModel | undefined> = this.store.activities.error
    private readonly activitiesPageResetSearch: Signal<boolean> = this.store.activities.params.resetSearch
    public readonly activitiesPageQueryParam: Signal<string | undefined> = this.store.activities.params.q

    public readonly activitiesPageSortParam: Signal<string | undefined> = this.store.activities.params.sort
    public readonly activitiesPageAtParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.activities.params.at() ),
    )
    public readonly activitiesPageIsAvailableParam: Signal<boolean | undefined> = this.store.activities.params.isAvailable
    public readonly activitiesPageIsVisibleParam: Signal<boolean | undefined> = this.store.activities.params.isVisible

    public readonly activityMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element
    public readonly activityMovementsPageLoading: Signal<boolean> = this.store.movements.loading
    public readonly activityMovementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading
    public readonly activityMovementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error
    public readonly activityStatistics: Signal<ActivityStatisticsModel | undefined> = this.store.statistics.element
    public readonly activityStatisticsLoading: Signal<boolean> = this.store.statistics.loading
    public readonly activityStatisticsError: Signal<NotificationModel | undefined> = this.store.statistics.error
    public readonly activityMovementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch
    public readonly activityMovementsPageTypeParam: Signal<string | undefined> = this.store.movements.params.type

    public readonly activityMovementsPageSortParam: Signal<string | undefined> = this.store.movements.params.sort
    public readonly activityMovementsPageFromParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.from() ),
    )
    public readonly activityMovementsPageToParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.to() ),
    )
    public readonly activityMovementsPageIsVisibleParam: Signal<boolean | undefined> = this.store.movements.params.isVisible

    public readonly availabilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = this.translated( this.store.metadata.availabilities )
    public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = this.translated( this.store.metadata.visibilities )

    private translated (items: Signal<SelectOptionModel<boolean | undefined>[]>): Signal<SelectOptionModel<boolean | undefined>[]> {
        return computed( (): SelectOptionModel<boolean | undefined>[] => items().map(
            (status: SelectOptionModel<boolean | undefined>): SelectOptionModel<boolean | undefined> => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }),
        ) )
    }

    public fetchActivitiesPage (
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.activitiesPageResetSearch() ? 0 : page
        this.store.fetchActivitiesPage( { projectId: this.selectedProjectId(), page: index, size: size } )
    }

    public inputPageSearchParameters (
        q: string | undefined,
        at: Date | undefined,
        isAvailable: boolean | undefined,
        isVisible: boolean | undefined,
        sort: string | undefined = undefined,
    ): void {
        const resetSearch: boolean = this.activitiesPageQueryParam() != q
                                     || this.activitiesPageAtParam()?.toISOString() != at?.toISOString()
                                     || this.activitiesPageIsAvailableParam() != isAvailable
                                     || this.activitiesPageIsVisibleParam() != isVisible
                                     || this.activitiesPageSortParam() != sort

        if (resetSearch) {
            this.store.updateActivitiesPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                q: q,
                isAvailable: isAvailable,
                at: at?.toISOString(),
                sort: sort,
            } )
        }
    }

    public fetchActivityMovementsPage (
        id: string,
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.activityMovementsPageResetSearch() ? 0 : page
        this.store.fetchActivityMovementsPage( { projectId: this.selectedProjectId(), id: id, page: index, size: size } )
    }

    public fetchActivityStatistics (id: string): void {
        this.store.fetchActivityStatistics( { projectId: this.selectedProjectId(), id: id } )
    }

    public reloadActivityStatistics (id: string): void {
        this.store.reloadActivityStatistics( { projectId: this.selectedProjectId(), id: id } )
    }

    public reloadActivityMovementsPage (id: string): void {
        this.store.fetchActivityMovementsPage( { projectId: this.selectedProjectId(), id: id, ...CumulativePageHelper.reloadRequest( this.activityMovementsPage() ) } )
    }

    public inputMovementsPageSearchParameters (
        type: string | undefined,
        from: Date | undefined,
        to: Date | undefined,
        isVisible: boolean | undefined,
        sort: string | undefined = undefined,
    ): void {
        const resetSearch: boolean = this.activityMovementsPageTypeParam() != type
                                     || this.activityMovementsPageFromParam()?.toISOString() != from?.toISOString()
                                     || this.activityMovementsPageToParam()?.toISOString() != to?.toISOString()
                                     || this.activityMovementsPageIsVisibleParam() != isVisible
                                     || this.activityMovementsPageSortParam() != sort

        if (resetSearch) {
            this.store.updateActivityMovementsPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                isCurrent: false,
                hasActivity: true,
                type: type,
                from: from?.toISOString(),
                to: to?.toISOString(),
                sort: sort,
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
            tap( (created: ActivityModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateActivity (id: string, activity: ActivityDto, ifMatch?: string): Observable<ActivityModel> {
        return this.api.updateActivityById( this.selectedProjectId(), id, activity, ifMatch ).pipe(
            tap( (updated: ActivityModel): void => this.onCommandSuccess( 'edit', updated ) ),
        )
    }

    public softDeleteActivity (id: string): Observable<ActivityModel> {
        return this.api.softDeleteActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: ActivityModel): void => this.onCommandSuccess( 'softDelete', disabled ) ),
        )
    }

    public restoreActivity (id: string): Observable<ActivityModel> {
        return this.api.restoreActivityById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: ActivityModel): void => this.onCommandSuccess( 'restore', enabled ) ),
        )
    }

    public hardDeleteActivity (activity: ActivityModel): Observable<void> {
        return this.api.hardDeleteActivityById( undefined, activity.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'hardDelete', activity ) ),
        )
    }

    private onCommandSuccess (command: string, activity: ActivityModel): void {
        this.notifySuccess( `activities.notifications.${ command }`, { name: activity?.name } )

        this.store.fetchActivitiesPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.activitiesPage() ) } )
    }
}
