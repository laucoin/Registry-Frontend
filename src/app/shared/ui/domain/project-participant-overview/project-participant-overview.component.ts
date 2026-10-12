import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/divider'
import '@sgdf/ui/button'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Signal } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";

/**
 * Purpose: Shows the head count of the project participants by presence status.
 * Scope: Displays the registered and guest counters and the total.
 * Limits: Static placeholder values until the data is plugged; no navigation yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-participant-overview',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-participant-overview.component.css',
	templateUrl: './project-participant-overview.component.html',
})
export class ProjectParticipantOverviewComponent {
	protected readonly stats: { labelKey: string, value: number }[] = [
		{ labelKey: 'registeredPresent', value: 124 },
		{ labelKey: 'registeredOut', value: 2 },
		{ labelKey: 'guestsPresent', value: 2 },
	]
	protected readonly total: Signal<number> = computed((): number => this.stats.reduce((sum: number, it: { value: number }): number => sum + it.value, 0))
}
