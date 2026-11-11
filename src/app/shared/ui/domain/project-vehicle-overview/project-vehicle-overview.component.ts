import { Component, computed, inject, input, OnInit } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RouteHelper } from '@shared/helpers/route.helper';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { OverviewStat } from '@shared/models/model/overview-stat.model';
import { ProjectOverviewCardComponent } from '@shared/ui/domain/project-overview-card/project-overview-card.component';

/**
 * Objectif: Affiche l'effectif des véhicules du projet par statut de présence.
 * Périmètre: Charge le statut des véhicules du projet sélectionné, affiche ses compteurs et son total, et renvoie vers la page de détail sauf si le lien est masqué.
 * Limites: Lit uniquement la facade du projet sélectionné ; un chargement échoué laisse les compteurs vides et rien n'est réessayé.
 */
@Component({
	imports: [ProjectOverviewCardComponent],
	selector: 'app-project-vehicle-overview',
	providers: [provideTranslocoScope('project-home')],
	templateUrl: './project-vehicle-overview.component.html',
})
export class ProjectVehicleOverviewComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/vehicles-status', RefreshKindEnum.LIVE, () =>
		this.facade.refreshVehiclesStatus(),
	);
	private readonly sessionFacade = inject(SessionFacade);

	public readonly showLink = input(true);

	protected readonly link = computed(
		() =>
			`/${RouteHelper.withProjectId(RegistryRouteEnum.PROJECTS_VEHICLES, this.sessionFacade.currentProjectId())}`,
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
