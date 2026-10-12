import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/avatar'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";

/**
 * Purpose: Lists the departures expected today on the project.
 * Scope: Displays each departure with its place and time.
 * Limits: Static placeholder values until the data is plugged; no navigation yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-upcoming-departure',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-upcoming-departure.component.css',
	templateUrl: './project-upcoming-departure.component.html',
})
export class ProjectUpcomingDepartureComponent {
	protected readonly departures: { name: string, detail: string, place: string, time: string }[] = [
		{ name: 'Camille Renaud', detail: 'Inscrite · responsable santé', place: 'Poste central', time: '09:41' },
		{ name: 'Théo Marchand', detail: 'Inscrit · Caravelle Paris', place: 'Porte ouest', time: '10:05' },
		{ name: 'Patrouille Lynx', detail: '7 personnes · 1 véhicule', place: 'Porte sud', time: '11:20' },
	]
}
