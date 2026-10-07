import { Routes } from '@angular/router'
import { ParticipantComponent } from '@pages/projects/[projectId]/configuration/participants/participant.component'
import { ParticipantsListComponent } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.component'
import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'
import { ParticipantMovementsListComponent } from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.component'

export const participantRoutes: Routes = [
    {
        path: '',
        component: ParticipantComponent,
        children: [
            {
                path: '', component: ParticipantsListComponent,
            },
            {
                path: ParticipantRoutesEnum.CREATE, component: ParticipantFormComponent,
            },
            {
                path: ParticipantRoutesEnum.EDIT, component: ParticipantFormComponent,
            },
            {
                path: ParticipantRoutesEnum.MOVEMENTS, component: ParticipantMovementsListComponent,
            },
        ],
    },
]
