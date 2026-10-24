import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { provideTranslocoScope } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { PlannedMovementCardComponent } from '@shared/ui/domain/planned-movement-card/planned-movement-card.component';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';

/**
 * Purpose: Liste les arrivées prévues aujourd'hui sur le projet.
 * Scope: Charge les arrivées prévues du projet sélectionné et les donne à la carte des mouvements prévus.
 * Limits: Lit uniquement la facade du projet sélectionné ; n'affiche rien de plus que la carte.
 */
@Component({
	imports: [
		PlannedMovementCardComponent
	],
	selector: 'app-project-upcoming-arrival',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-upcoming-arrival.component.css',
	templateUrl: './project-upcoming-arrival.component.html',
})
export class ProjectUpcomingArrivalComponent implements OnInit {
	private readonly facade: SelectedProjectFacade = inject(SelectedProjectFacade)

	private readonly autoRefresh: void = injectAutoRefresh('project-home/arrivals', 'dayBound', (): void => this.facade.refreshPlannedArrivals())

	protected readonly movements: Signal<PlannedMovementModel[] | undefined> = this.facade.plannedArrivals
	protected readonly loading: Signal<boolean> = this.facade.plannedArrivalsLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.plannedArrivalsError

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchPlannedArrivals()
	}
}
