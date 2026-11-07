import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RouteHelper } from '@shared/helpers/route.helper';

import '@sgdf/ui/table';
import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';
import '@sgdf/ui/divider';
import '@sgdf/ui/button';

interface OverviewStat {
	labelKey: string;
	value: number | undefined;
}

/**
 * Purpose: Affiche l'effectif des véhicules du projet par statut de présence.
 * Scope: Charge le statut des véhicules du projet sélectionné, affiche ses compteurs et son total, et renvoie vers la page de détail sauf si le lien est masqué.
 * Limits: Lit uniquement la facade du projet sélectionné ; un chargement échoué laisse les compteurs vides et rien n'est réessayé.
 */
@Component({
	imports: [TranslocoPipe, DateFormatPipe, RouterLink],
	selector: 'app-project-vehicle-overview',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-vehicle-overview.component.css',
	templateUrl: './project-vehicle-overview.component.html',
})
export class ProjectVehicleOverviewComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/vehicles-status', 'live', () =>
		this.facade.refreshVehiclesStatus(),
	);
	private readonly sessionFacade = inject(SessionFacade);

	public readonly showLink = input(true);

	protected readonly link = computed(() =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_VEHICLES).replace(
			':projectId',
			this.sessionFacade.currentProjectId() ?? '',
		),
	);

	protected readonly stats = computed(() => this.buildStats());
	protected readonly lastRefresh = computed(() => this.facade.vehiclesStatus()?.lastRefresh);
	protected readonly total = computed(() => this.buildTotal());

	public ngOnInit(): void {
		this.facade.fetchVehiclesStatus();
	}

	private buildStats(): OverviewStat[] {
		const status = this.facade.vehiclesStatus();
		return [
			{ labelKey: 'present', value: status?.present },
			{ labelKey: 'out', value: status?.absent },
		];
	}

	private buildTotal(): number | undefined {
		const status = this.facade.vehiclesStatus();
		return status && status.present + status.absent;
	}
}
