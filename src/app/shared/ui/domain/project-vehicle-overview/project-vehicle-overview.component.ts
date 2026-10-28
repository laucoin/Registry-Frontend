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
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';

interface OverviewStat {
	labelKey: string
	value: number | undefined
}

/**
 * Purpose: Affiche l'effectif des véhicules du projet par statut de présence.
 * Scope: Charge le statut des véhicules du projet sélectionné, affiche ses compteurs et son total, et renvoie vers la page de détail sauf si le lien est masqué.
 * Limits: Lit uniquement la facade du projet sélectionné ; un chargement échoué laisse les compteurs vides et rien n'est réessayé.
 */
@Component({
	imports: [
		TranslocoPipe,
		DateFormatPipe,
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

	private readonly autoRefresh: void = injectAutoRefresh('project-home/vehicles-status', 'live', (): void => this.facade.refreshVehiclesStatus());
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
	protected readonly lastRefresh: Signal<Date | undefined> = computed((): Date | undefined => this.facade.vehiclesStatus()?.lastRefresh);
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => {
		const status: VehicleStatusModel | undefined = this.facade.vehiclesStatus();
		return status && status.present + status.absent;
	});

	public ngOnInit(): void {
		this.facade.fetchVehiclesStatus();
	}
}
