import { Routes } from '@angular/router'
import { ParticipantComponent } from './participant.component'
import { ParticipantsListComponent } from './participants-list/participants-list.component'
import { ParticipantRoutesEnum } from './participant-routes.enum'
import { ParticipantFormComponent } from './participant-form/participant-form.component'
import { ParticipantMovementsListComponent } from './participant-movements-list/participant-movements-list.component'

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
