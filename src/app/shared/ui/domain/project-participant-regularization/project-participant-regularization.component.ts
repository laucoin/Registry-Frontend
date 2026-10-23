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
 * Purpose: Lists the participants whose presence went past the planned end and needs regularizing.
 * Scope: Displays the participants with their planned end and how long they have been present.
 * Limits: Static placeholder values until the data is plugged; no navigation yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-participant-regularization',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-participant-regularization.component.css',
	templateUrl: './project-participant-regularization.component.html',
})
export class ProjectParticipantRegularizationComponent {
	protected readonly participants: { name: string, detail: string }[] = [
		{ name: 'Jeanne Martin', detail: 'Fin prévue le 16 juillet · présente depuis 2 jours' },
		{ name: 'Nassim Benali', detail: 'Fin prévue le 17 juillet · présent depuis 1 jour' },
	]
}
