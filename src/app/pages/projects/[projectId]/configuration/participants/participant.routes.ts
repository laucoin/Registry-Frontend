import { Routes } from '@angular/router'
import { ParticipantPage } from '@pages/projects/[projectId]/configuration/participants/participant.page'
import { ParticipantsListPage } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.page'
import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum'
import { ParticipantFormPage } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.page'
import { ParticipantMovementsListPage } from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.page'

export const participantRoutes: Routes = [
    {
        path: '',
        component: ParticipantPage,
        children: [
            {
                path: '', title: 'seo.participants.list', component: ParticipantsListPage,
            },
            {
                path: ParticipantRoutesEnum.CREATE, title: 'seo.participants.create', component: ParticipantFormPage,
            },
            {
                path: ParticipantRoutesEnum.EDIT, title: 'seo.participants.edit', component: ParticipantFormPage,
            },
            {
                path: ParticipantRoutesEnum.MOVEMENTS, title: 'seo.participants.movements', component: ParticipantMovementsListPage,
            },
        ],
    },
]
