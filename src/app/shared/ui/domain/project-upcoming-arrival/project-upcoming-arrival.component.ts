import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { provideTranslocoScope } from "@jsverse/transloco";
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { PlannedMovementCardComponent } from '@shared/ui/domain/planned-movement-card/planned-movement-card.component';

/**
 * Purpose: Lists the arrivals planned today on the project.
 * Scope: Loads the planned arrivals of the selected project and gives them to the planned movement card.
 * Limits: Reads the selected project facade only; it shows no more than the card shows.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
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
