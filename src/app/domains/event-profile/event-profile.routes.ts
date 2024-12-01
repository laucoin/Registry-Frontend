import { Routes } from '@angular/router'
import { EventProfileComponent } from './event-profile.component'
import { EventProfilesListComponent } from './event-profiles-list/event-profiles-list.component'
import {
    EventProfileInvitationFormComponent,
} from './event-profile-form/event-profile-invitation-form/event-profile-invitation-form.component'
import { EventProfileRoutesEnum } from './event-profile-routes.enum'
import {
    EventProfileEditionFormComponent,
} from './event-profile-form/event-profile-edition-form/event-profile-edition-form.component'

export const eventProfileRoutes: Routes = [
    {
        path: '', component: EventProfileComponent, children: [
            {
                path: '', component: EventProfilesListComponent,
            },
            {
                path: EventProfileRoutesEnum.INVITE, component: EventProfileInvitationFormComponent,
            },
            {
                path: EventProfileRoutesEnum.EDIT, component: EventProfileEditionFormComponent,
            },
        ],
    },
]
