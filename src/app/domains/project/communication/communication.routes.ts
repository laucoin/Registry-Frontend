import { Routes } from '@angular/router'
import { CommunicationRoutesEnum } from './communication-routes.enum'
import { CommunicationFormComponent } from './communication-form/communication-form.component'
import { CommunicationsListComponent } from './communications-list/communications-list.component'
import { CommunicationComponent } from './communication.component'

export const communicationRoutes: Routes = [
    {
        path: '',
        component: CommunicationComponent,
        children: [
            {
                path: '', component: CommunicationsListComponent,
            },
            {
                path: CommunicationRoutesEnum.CREATE, component: CommunicationFormComponent,
            },
            {
                path: CommunicationRoutesEnum.EDIT, component: CommunicationFormComponent,
            },
        ],
    },
]
