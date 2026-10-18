import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tab-group'
import '@sgdf/ui/badge'
import '@sgdf/ui/list-item'
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { MovementModel } from '@shared/models/model/movement.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { PageModel } from '@shared/models/model/page.model';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';

type MonitoringTabKey = 'activities' | 'otherMovements'

interface MonitoringTab {
	key: MonitoringTabKey
	page: Signal<PageModel<MovementModel> | undefined>
	loading: Signal<boolean>
	silentLoading: Signal<boolean>
	error: Signal<NotificationModel | undefined>
	fetch: (page: number | undefined, size: number | undefined) => void
}

/**
 * Purpose: Tracks what is happening on the project through the movements in progress with an activity and the other ones.
 * Scope: Loads the first batch of the first tab at once and of each other tab when it is first shown, then lets the list load more.
 * Limits: The participant, group and vehicle statuses live in their own pages; it reads the selected project facade only.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		TranslocoPipe,
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
export class ProjectOperationalMonitoringComponent implements OnInit {
	private static readonly PAGE_SIZE: number = 10

	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)
	private readonly visited: WritableSignal<ReadonlySet<MonitoringTabKey>> = signal(new Set<MonitoringTabKey>(['activities']))

	protected readonly tabs: MonitoringTab[] = [
		{
			key: 'activities',
			page: this.facade.currentMovementsPageWithActivity,
			loading: this.facade.currentMovementsPageWithActivityLoading,
			silentLoading: this.facade.currentMovementsPageWithActivitySilentLoading,
			error: this.facade.currentMovementsPageWithActivityError,
			fetch: (page: number | undefined, size: number | undefined): void => this.facade.fetchCurrentMovementsPageWithActivity(page, size),
		},
		{
			key: 'otherMovements',
			page: this.facade.currentMovementsPageWithoutActivity,
			loading: this.facade.currentMovementsPageWithoutActivityLoading,
			silentLoading: this.facade.currentMovementsPageWithoutActivitySilentLoading,
			error: this.facade.currentMovementsPageWithoutActivityError,
			fetch: (page: number | undefined, size: number | undefined): void => this.facade.fetchCurrentMovementsPageWithoutActivity(page, size),
		},
	]

	public ngOnInit(): void {
		this.tabs[0]!.fetch(undefined, ProjectOperationalMonitoringComponent.PAGE_SIZE)
	}

	protected isVisited(key: MonitoringTabKey): boolean {
		return this.visited().has(key)
	}

	protected loadBatch(tab: MonitoringTab, event: PageEventModel): void {
		tab.fetch(event.page, event.size)
	}

	protected onTabShow(event: Event): void {
		const tab: MonitoringTab | undefined = this.tabs.find((it: MonitoringTab): boolean => it.key === (event as CustomEvent<{ name: string }>).detail?.name)
		if (!tab || this.isVisited(tab.key)) {
			return
		}

		this.visited.update((current: ReadonlySet<MonitoringTabKey>): ReadonlySet<MonitoringTabKey> => new Set(current).add(tab.key))
		tab.fetch(undefined, ProjectOperationalMonitoringComponent.PAGE_SIZE)
	}
}
