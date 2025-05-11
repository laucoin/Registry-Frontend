import { Routes } from '@angular/router'
import { ProjectProfileComponent } from './project-profile.component'
import { ProjectProfilesListComponent } from './project-profiles-list/project-profiles-list.component'
import {
    ProjectProfileInvitationFormComponent,
} from './project-profile-form/project-profile-invitation-form/project-profile-invitation-form.component'
import { ProjectProfileRoutesEnum } from './project-profile-routes.enum'
import {
    ProjectProfileEditionFormComponent,
} from './project-profile-form/project-profile-edition-form/project-profile-edition-form.component'

export const projectProfileRoutes: Routes = [
    {
        path: '',
        component: ProjectProfileComponent,
        children: [
            {
                path: '', component: ProjectProfilesListComponent,
            },
            {
                path: ProjectProfileRoutesEnum.INVITE, component: ProjectProfileInvitationFormComponent,
            },
            {
                path: ProjectProfileRoutesEnum.EDIT, component: ProjectProfileEditionFormComponent,
            },
        ],
    },
]
