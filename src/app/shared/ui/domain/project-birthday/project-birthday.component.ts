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
 * Purpose: Lists the participants whose birthday is today.
 * Scope: Displays each participant with their age and unit.
 * Limits: Static placeholder values until the data is plugged; no navigation yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-birthday',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-birthday.component.css',
	templateUrl: './project-birthday.component.html',
})
export class ProjectBirthdayComponent {
	protected readonly birthdays: { name: string, age: number, detail: string }[] = [
		{ name: 'Noé Berthier', age: 16, detail: 'Groupe Scout de Lyon' },
		{ name: 'Alice Perret', age: 14, detail: 'Unité Caravelle Paris' },
		{ name: 'Hugo Lemoine', age: 38, detail: 'Encadrant logistique' },
	]
}
