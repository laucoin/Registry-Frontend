import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tab-group'
import '@sgdf/ui/badge'
import '@sgdf/ui/list-item'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, Signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { PageModel } from '@shared/models/model/page.model';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';

type MonitoringTabKey = 'activities' | 'otherMovements'

interface MonitoringTab {
	key: MonitoringTabKey
	page: Signal<PageModel<MovementModel> | undefined>
	loading: Signal<boolean>
	silentLoading: Signal<boolean>
	error: Signal<NotificationModel | undefined>
	fetch: (page: number | undefined, size: number | undefined) => void
	refresh: () => void
}

/**
 * Purpose: Tracks what is happening on the project through the movements in progress with an activity and the other ones.
 * Scope: Loads the first batch of every tab at once so counts and lists are ready when a tab is shown, then lets the list load more. Without the activity option only the other movements remain, shown as a single list instead of a tab.
 * Limits: The participant, group and vehicle statuses live in their own pages; it reads the selected project facade only.
 */
@Component({
	imports: [
		TranslocoPipe,
		NgTemplateOutlet,
		ListComponent,
		RegistryTemplateDirective,
		MovementElementComponent
	],
	selector: 'app-project-operational-monitoring',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-operational-monitoring.component.css',
	templateUrl: './project-operational-monitoring.component.html',
})
export class ProjectOperationalMonitoringComponent {
	private static readonly PAGE_SIZE: number = 10

	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)

	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	private readonly hasActivityOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.ACTIVITY)

	private readonly activitiesTab: MonitoringTab = {
		key: 'activities',
		page: this.facade.currentMovementsPageWithActivity,
		loading: this.facade.currentMovementsPageWithActivityLoading,
		silentLoading: this.facade.currentMovementsPageWithActivitySilentLoading,
		error: this.facade.currentMovementsPageWithActivityError,
		fetch: (page: number | undefined, size: number | undefined): void => this.facade.fetchCurrentMovementsPageWithActivity(page, size),
		refresh: (): void => this.facade.refreshCurrentMovementsPageWithActivity(),
	}

	private readonly otherMovementsTab: MonitoringTab = {
		key: 'otherMovements',
		page: this.facade.currentMovementsPageWithoutActivity,
		loading: this.facade.currentMovementsPageWithoutActivityLoading,
		silentLoading: this.facade.currentMovementsPageWithoutActivitySilentLoading,
		error: this.facade.currentMovementsPageWithoutActivityError,
		fetch: (page: number | undefined, size: number | undefined): void => this.facade.fetchCurrentMovementsPageWithoutActivity(page, size),
		refresh: (): void => this.facade.refreshCurrentMovementsPageWithoutActivity(),
	}

	protected readonly tabs: Signal<MonitoringTab[]> = computed((): MonitoringTab[] => this.hasActivityOption()
		? [this.activitiesTab, this.otherMovementsTab]
		: [this.otherMovementsTab])

	private readonly autoRefresh: void = injectAutoRefresh('project-home/movements', 'live', (): void => this.tabs().forEach((tab: MonitoringTab): void => tab.refresh()))

	public constructor() {
		effect((): void => {
			const tabs: MonitoringTab[] = this.tabs()
			untracked((): void => tabs.forEach((tab: MonitoringTab): void => tab.fetch(undefined, ProjectOperationalMonitoringComponent.PAGE_SIZE)))
		})
	}

	protected loadBatch(tab: MonitoringTab, event: PageEventModel): void {
		tab.fetch(event.page, event.size)
	}
}
