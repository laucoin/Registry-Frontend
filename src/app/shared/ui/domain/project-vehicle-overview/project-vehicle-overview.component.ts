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
 * Purpose: Shows the project vehicles count by presence status.
 * Scope: Displays the present and out counters and the total.
 * Limits: Static placeholder values until the data is plugged; no navigation yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-vehicle-overview',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-vehicle-overview.component.css',
	templateUrl: './project-vehicle-overview.component.html',
})
export class ProjectVehicleOverviewComponent {
	protected readonly stats: { labelKey: string, value: number }[] = [
		{ labelKey: 'present', value: 3 },
		{ labelKey: 'out', value: 3 },
	]
	protected readonly total: Signal<number> = computed((): number => this.stats.reduce((sum: number, it: { value: number }): number => sum + it.value, 0))
}
