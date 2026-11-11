import { Component, inject } from '@angular/core';

import { ActivityStatisticsComponent } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-statistics/activity-statistics.component';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { ElementMovementsListComponent } from '@pages/projects/[projectId]/movements/element-movements/element-movements-list.component';
import { injectElementMovements } from '@pages/projects/[projectId]/movements/element-movements/inject-element-movements';
import { ActivityModel } from '@shared/models/model/activity.model';

/**
 * Objectif: Page listant les mouvements d'une activité avec ses statistiques.
 * Périmètre: Relie les mouvements de l'activité, sa recherche et ses statistiques à la facade des activités.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-activity-movements-list',
	imports: [ElementMovementsListComponent, ActivityStatisticsComponent],
	templateUrl: './activity-movements-list.page.html',
})
export class ActivityMovementsListPage {
	private readonly facade = inject(ActivityFacade);

	protected readonly movements = injectElementMovements<ActivityModel>({
		idParam: 'activityId',
		page: this.facade.activityMovementsPage,
		pageError: this.facade.activityMovementsPageError,
		pageLoading: this.facade.activityMovementsPageLoading,
		pageSilentLoading: this.facade.activityMovementsPageSilentLoading,
		appliedFilters: () => [
			this.facade.activityMovementsPageTypeParam(),
			this.facade.activityMovementsPageFromParam(),
			this.facade.activityMovementsPageToParam(),
			this.facade.activityMovementsPageIsVisibleParam(),
		],
		fetchElement: (id) => this.facade.fetchActivity(id),
		fetchDetails: (id) => this.facade.fetchActivityStatistics(id),
		reloadDetails: (id) => this.facade.reloadActivityStatistics(id),
		fetchPage: (id, page, size) => this.facade.fetchActivityMovementsPage(id, page, size),
		reloadPage: (id) => this.facade.reloadActivityMovementsPage(id),
		inputSearch: (search) =>
			this.facade.inputMovementsPageSearchParameters(
				search.type,
				search.from,
				search.to,
				search.isVisible,
				search.sort,
			),
		titleOf: (activity) => activity.name,
	});
}
