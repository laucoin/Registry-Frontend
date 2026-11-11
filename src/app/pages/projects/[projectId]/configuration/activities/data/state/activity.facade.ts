import { computed, inject, Injectable, Signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto';
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api';
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store';
import { DateHelper } from '@shared/helpers/date.helper';
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { ActivityModel } from '@shared/models/model/activity.model';
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';

/**
 * Objectif: Point d'entrée public du domaine des activités pour les pages, composants et guards.
 * Périmètre: Expose le store des activités sous forme de signals, relaie ses requêtes et exécute les commandes d'activité avec leurs notifications.
 * Limites: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class ActivityFacade extends GenericProjectElementFacade {
	private readonly api = inject(ActivityApi);

	private readonly store: InstanceType<typeof ActivityStore> = inject(ActivityStore);

	public readonly activitiesPage: Signal<PageModel<ActivityModel> | undefined> = this.store.activities.element;
	public readonly activitiesPageLoading = this.store.activities.loading;
	public readonly activitiesPageSilentLoading = this.store.activities.silentLoading;
	public readonly activitiesPageError: Signal<NotificationModel | undefined> = this.store.activities.error;
	private readonly activitiesPageResetSearch = this.store.activities.params.resetSearch;
	public readonly activitiesPageQueryParam = this.store.activities.params.q;

	public readonly activitiesPageAtParam = computed(() => DateHelper.buildDate(this.store.activities.params.at()));
	public readonly activitiesPageIsAvailableParam = this.store.activities.params.isAvailable;
	public readonly activitiesPageIsVisibleParam = this.store.activities.params.isVisible;

	public readonly activityMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element;
	public readonly activityMovementsPageLoading = this.store.movements.loading;
	public readonly activityMovementsPageSilentLoading = this.store.movements.silentLoading;
	public readonly activityMovementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error;
	public readonly activityStatistics: Signal<ActivityStatisticsModel | undefined> = this.store.statistics.element;
	public readonly activityStatisticsLoading = this.store.statistics.loading;
	public readonly activityStatisticsError: Signal<NotificationModel | undefined> = this.store.statistics.error;
	private readonly activityMovementsPageResetSearch = this.store.movements.params.resetSearch;
	public readonly activityMovementsPageTypeParam = this.store.movements.params.type;

	public readonly activityMovementsPageFromParam = computed(() =>
		DateHelper.buildDate(this.store.movements.params.from()),
	);
	public readonly activityMovementsPageToParam = computed(() =>
		DateHelper.buildDate(this.store.movements.params.to()),
	);
	public readonly activityMovementsPageIsVisibleParam = this.store.movements.params.isVisible;

	public readonly availabilitiesMetadata = this.translatedOptions(this.store.metadata.availabilities);
	public readonly visibilitiesMetadata = this.translatedOptions(this.store.metadata.visibilities);

	public fetchActivitiesPage(page: number | undefined, size: number | undefined): void {
		const index = this.activitiesPageResetSearch() ? 0 : page;
		this.store.fetchActivitiesPage({ projectId: this.selectedProjectId(), page: index, size: size });
	}

	public inputPageSearchParameters(
		q: string | undefined,
		at: Date | undefined,
		isAvailable: boolean | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			isVisible,
			q,
			isAvailable,
			at: DateHelper.toIsoInstant(at),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.activities.params(), next)) return;
		this.store.updateActivitiesPageSearchParams({ ...next, resetSearch: true });
	}

	public fetchActivityMovementsPage(id: string, page: number | undefined, size: number | undefined): void {
		const index = this.activityMovementsPageResetSearch() ? 0 : page;
		this.store.fetchActivityMovementsPage({ projectId: this.selectedProjectId(), id: id, page: index, size: size });
	}

	public fetchActivityStatistics(id: string): void {
		this.store.fetchActivityStatistics({ projectId: this.selectedProjectId(), id: id });
	}

	public reloadActivityStatistics(id: string): void {
		this.store.reloadActivityStatistics({ projectId: this.selectedProjectId(), id: id });
	}

	public reloadActivityMovementsPage(id: string): void {
		this.store.fetchActivityMovementsPage({
			projectId: this.selectedProjectId(),
			id: id,
			...CumulativePageHelper.reloadRequest(this.activityMovementsPage()),
		});
	}

	public inputMovementsPageSearchParameters(
		type: string | undefined,
		from: Date | undefined,
		to: Date | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			isVisible,
			type,
			from: DateHelper.toIsoInstant(from),
			to: DateHelper.toIsoInstant(to),
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.movements.params(), next)) return;
		this.store.updateActivityMovementsPageSearchParams({
			...next,
			resetSearch: true,
			isCurrent: false,
			hasActivity: true,
		});
	}

	public fetchActivity(id: string): Observable<ActivityModel> {
		return this.api.findActivityById(this.selectedProjectId(), id).pipe(notifyOnError(this.uiFacade));
	}

	public createActivity(activity: ActivityDto): Observable<ActivityModel> {
		return this.api
			.createActivity(this.selectedProjectId(), activity)
			.pipe(tap((created) => this.onCommandSuccess('create', created)));
	}

	public updateActivity(id: string, activity: ActivityDto, ifMatch?: string): Observable<ActivityModel> {
		return this.api
			.updateActivityById(this.selectedProjectId(), id, activity, ifMatch)
			.pipe(tap((updated) => this.onCommandSuccess('edit', updated)));
	}

	public softDeleteActivity(id: string): Observable<ActivityModel> {
		return this.api.softDeleteActivityById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((disabled) => this.onCommandSuccess('softDelete', disabled)),
		);
	}

	public restoreActivity(id: string): Observable<ActivityModel> {
		return this.api.restoreActivityById(this.selectedProjectId(), id).pipe(
			notifyOnError(this.uiFacade),
			tap((enabled) => this.onCommandSuccess('restore', enabled)),
		);
	}

	public hardDeleteActivity(activity: ActivityModel): Observable<void> {
		return this.api.hardDeleteActivityById(undefined, activity.id).pipe(
			notifyOnError(this.uiFacade),
			tap(() => this.onCommandSuccess('hardDelete', activity)),
		);
	}

	private onCommandSuccess(command: string, activity: ActivityModel): void {
		this.notifySuccess(`activities.notifications.${command}`, { name: activity.name });

		this.store.fetchActivitiesPage({
			projectId: this.selectedProjectId(),
			...CumulativePageHelper.reloadRequest(this.activitiesPage()),
		});
	}
}
