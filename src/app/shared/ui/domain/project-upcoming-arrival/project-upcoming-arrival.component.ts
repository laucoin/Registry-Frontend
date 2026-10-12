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
 * Purpose: Lists the arrivals expected today on the project.
 * Scope: Displays each arrival with its place and time.
 * Limits: Static placeholder values until the data is plugged; no navigation yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-upcoming-arrival',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-upcoming-arrival.component.css',
	templateUrl: './project-upcoming-arrival.component.html',
})
export class ProjectUpcomingArrivalComponent {
	protected readonly arrivals: { name: string, detail: string, place: string, time: string }[] = [
		{ name: 'Groupe Grenoble', detail: '26 personnes · inscrits', place: 'Accueil', time: '10:32' },
		{ name: 'Dr. Sylvie Bloch', detail: 'Invitée · médecin', place: 'Accueil', time: '10:32' },
		{ name: 'Léa Fontaine', detail: 'Inscrite · retour d\'hôpital', place: 'Poste central', time: '11:15' },
	]
}
