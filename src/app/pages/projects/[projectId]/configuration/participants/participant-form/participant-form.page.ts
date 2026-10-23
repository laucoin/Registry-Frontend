import { Component } from '@angular/core'
import {
    ParticipantFormComponent
} from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'

@Component({
	imports: [
		ParticipantFormComponent,
	],
	templateUrl: './participant-form.page.html',
})
export class ParticipantFormPage {
}
