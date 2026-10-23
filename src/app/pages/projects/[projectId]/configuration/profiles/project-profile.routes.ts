import { Routes } from '@angular/router'
import { ProjectProfilePage } from '@pages/projects/[projectId]/configuration/profiles/project-profile.page'
import { ProjectProfilesListPage } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.page'
import {
    ProjectProfileInvitationFormPage,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-form/project-profile-invitation-form.page'
import { ProjectProfileRoutesEnum } from '@pages/projects/[projectId]/configuration/profiles/project-profile-routes.enum'
import {
    ProjectProfileEditionFormPage,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/project-profile-edition-form.page'

export const projectProfileRoutes: Routes = [
    {
        path: '',
        component: ProjectProfilePage,
        children: [
            {
                path: '', title: 'seo.profiles.list', component: ProjectProfilesListPage,
                children: [
                    { path: ProjectProfileRoutesEnum.EDIT, title: 'seo.profiles.edit', component: ProjectProfileEditionFormPage },
                ],
            },
            {
                path: ProjectProfileRoutesEnum.INVITE, title: 'seo.profiles.invite', component: ProjectProfileInvitationFormPage,
            },
        ],
    },
]
