import { Component } from '@angular/core'
import {
    ParticipantFormComponent
} from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'

/**
 * Purpose: Page with the form to create or edit a participant.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
	imports: [
		ParticipantFormComponent,
	],
	templateUrl: './participant-form.page.html',
})
export class ParticipantFormPage {
}
