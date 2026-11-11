import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementCardComponent } from '@shared/ui/domain/planned-movement-card/planned-movement-card.component';

/**
 * Objectif: Liste les arrivées prévues aujourd'hui sur le projet.
 * Périmètre: Charge les arrivées prévues du projet sélectionné et les donne à la carte des mouvements prévus.
 * Limites: Lit uniquement la facade du projet sélectionné ; n'affiche rien de plus que la carte.
 */
@Component({
	imports: [PlannedMovementCardComponent],
	selector: 'app-project-upcoming-arrival',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-upcoming-arrival.component.css',
	templateUrl: './project-upcoming-arrival.component.html',
})
export class ProjectUpcomingArrivalComponent implements OnInit {
	private readonly facade = inject(SelectedProjectFacade);

	private readonly autoRefresh = injectAutoRefresh('project-home/arrivals', RefreshKindEnum.DAY_BOUND, () =>
		this.facade.refreshPlannedArrivals(),
	);

	protected readonly movements = this.facade.plannedArrivals;
	protected readonly loading = this.facade.plannedArrivalsLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.plannedArrivalsError;

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchPlannedArrivals();
	}
}
