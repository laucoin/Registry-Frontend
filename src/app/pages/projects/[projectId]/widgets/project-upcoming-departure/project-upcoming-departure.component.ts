import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementCardComponent } from '@shared/ui/domain/planned-movement-card/planned-movement-card.component';

/**
 * Objectif: Liste les départs prévus aujourd'hui sur le projet.
 * Périmètre: Charge les départs prévus du projet sélectionné et les donne à la carte des mouvements prévus.
 * Limites: Lit uniquement la facade du projet sélectionné ; n'affiche rien de plus que la carte.
 */
@Component({
	imports: [PlannedMovementCardComponent],
	selector: 'app-project-upcoming-departure',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-upcoming-departure.component.css',
	templateUrl: './project-upcoming-departure.component.html',
})
export class ProjectUpcomingDepartureComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/departures', RefreshKindEnum.DAY_BOUND, () =>
		this.facade.refreshPlannedDepartures(),
	);

	protected readonly movements = this.facade.plannedDepartures;
	protected readonly loading = this.facade.plannedDeparturesLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.plannedDeparturesError;

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchPlannedDepartures();
	}
}
