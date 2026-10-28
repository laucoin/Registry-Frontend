import { Component } from '@angular/core'
import {
    ParticipantFormComponent
} from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'

/**
 * Purpose: Page avec le formulaire de création ou d'édition d'un participant.
 * Scope: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	imports: [
		ParticipantFormComponent,
	],
	templateUrl: './participant-form.page.html',
})
export class ParticipantFormPage {
}
