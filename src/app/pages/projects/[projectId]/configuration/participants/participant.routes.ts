import { Routes } from '@angular/router'
import { ParticipantPage } from '@pages/projects/[projectId]/configuration/participants/participant.page'
import { ParticipantsListPage } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.page'
import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'
import { ParticipantMovementsListPage } from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.page'

export const participantRoutes: Routes = [
    {
        path: '',
        component: ParticipantPage,
        children: [
            {
                path: '', component: ParticipantsListPage,
            },
            {
                path: ParticipantRoutesEnum.CREATE, component: ParticipantFormComponent,
            },
            {
                path: ParticipantRoutesEnum.EDIT, component: ParticipantFormComponent,
            },
            {
                path: ParticipantRoutesEnum.MOVEMENTS, component: ParticipantMovementsListPage,
            },
        ],
    },
]
