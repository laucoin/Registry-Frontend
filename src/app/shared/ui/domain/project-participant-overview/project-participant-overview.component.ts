import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/divider'
import '@sgdf/ui/button'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, OnInit, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { RouteHelper } from '@shared/helpers/route.helper';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { ProjectStatusModel } from '@shared/models/model/project-status.model';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';

interface OverviewStat {
	labelKey: string
	value: number | undefined
}

/**
 * Purpose: Shows the head count of the project participants by presence status.
 * Scope: Loads the participants status of the selected project, displays its counters and total, and links to the detail page unless the link is hidden.
 * Limits: Reads the selected project facade only; a failed load leaves the counters empty and nothing is retried.
 */
@Component({
	imports: [
		TranslocoPipe,
		DateFormatPipe,
		RouterLink
	],
	selector: 'app-project-participant-overview',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-participant-overview.component.css',
	templateUrl: './project-participant-overview.component.html',
})
export class ProjectParticipantOverviewComponent implements OnInit {
	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade);

	private readonly autoRefresh: void = injectAutoRefresh('project-home/participants-status', 'live', (): void => this.facade.refreshParticipantsStatus());
	private readonly sessionFacade: SessionFacade = inject(SessionFacade);

	public readonly showLink: InputSignal<boolean> = input(true);

	protected readonly link: Signal<string> = computed((): string =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_PARTICIPANTS).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
	);

	protected readonly stats: Signal<OverviewStat[]> = computed((): OverviewStat[] => {
		const status: ProjectStatusModel | undefined = this.facade.participantsStatus();
		return [
			{ labelKey: 'registeredPresent', value: status && status.registered.presentMajors + status.registered.presentMinors },
			{ labelKey: 'registeredOut', value: status && status.registered.absentMajors + status.registered.absentMinors },
			{ labelKey: 'guestsPresent', value: status?.guests },
		];
	});
	protected readonly lastRefresh: Signal<Date | undefined> = computed((): Date | undefined => this.facade.participantsStatus()?.lastRefresh);
	protected readonly total: Signal<number | undefined> = computed((): number | undefined =>
		this.facade.participantsStatus() ? this.stats().reduce((sum: number, it: OverviewStat): number => sum + (it.value ?? 0), 0) : undefined,
	);

	public ngOnInit(): void {
		this.facade.fetchParticipantsStatus();
	}
}
