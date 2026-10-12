import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";

/**
 * Purpose: Shows the open alerts of the project with their automatic criticality.
 * Scope: Displays each alert with its age, message and communication action.
 * Limits: Static placeholder values until the data is plugged; no navigation or communication yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-active-alert',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-active-alert.component.css',
	templateUrl: './project-active-alert.component.html',
})
export class ProjectActiveAlertComponent {
	protected readonly alerts: { title: string, message: string, age: string, variant: 'danger' | 'warning' | 'info', criticalityKey: string }[] = [
		{
			title: 'Barrière nord endommagée',
			message: 'Accès maintenu sous surveillance.',
			age: '22 h',
			variant: 'danger',
			criticalityKey: 'projectHome.activeAlert.criticality.high'
		},
		{
			title: 'Météo : vigilance orange',
			message: 'Repli du secteur Nord à préparer avant 18 h.',
			age: '11 h',
			variant: 'warning',
			criticalityKey: 'projectHome.activeAlert.criticality.reinforced'
		},
		{
			title: 'Retard de livraison',
			message: 'La citerne d\'eau est attendue avec 45 min de retard.',
			age: '2 h',
			variant: 'info',
			criticalityKey: 'projectHome.activeAlert.criticality.recent'
		},
	]
}
