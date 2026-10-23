import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'

@Component( {
    imports: [
        ParticipantFormComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './participant-form.page.html',
} )
export class ParticipantFormPage {}
