import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/divider'
import '@sgdf/ui/button'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, OnInit, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { RouteHelper } from '@shared/helpers/route.helper';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';

interface OverviewStat {
	labelKey: string
	value: number | undefined
}

/**
 * Purpose: Shows the head count of the project vehicles by presence status.
 * Scope: Loads the vehicles status of the selected project, displays its counters and total, and links to the detail page unless the link is hidden.
 * Limits: Reads the selected project facade only; a failed load leaves the counters empty and nothing is retried.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		TranslocoPipe,
		RouterLink
	],
	selector: 'app-project-vehicle-overview',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-vehicle-overview.component.css',
	templateUrl: './project-vehicle-overview.component.html',
})
export class ProjectVehicleOverviewComponent implements OnInit {
	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade);
	private readonly sessionFacade: SessionFacade = inject(SessionFacade);

	public readonly showLink: InputSignal<boolean> = input(true);

	protected readonly link: Signal<string> = computed((): string =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_VEHICLES).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
	);

	protected readonly stats: Signal<OverviewStat[]> = computed((): OverviewStat[] => {
		const status: VehicleStatusModel | undefined = this.facade.vehiclesStatus();
		return [
			{ labelKey: 'present', value: status?.present },
			{ labelKey: 'out', value: status?.absent },
		];
	});
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => {
		const status: VehicleStatusModel | undefined = this.facade.vehiclesStatus();
		return status && status.present + status.absent;
	});

	public ngOnInit(): void {
		this.facade.fetchVehiclesStatus();
	}
}
