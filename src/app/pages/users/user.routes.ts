import { Routes } from '@angular/router'
import { UserPage } from '@pages/users/user.page'
import { UsersListPage } from '@pages/users/users-list/users-list.page'
import { UserFormPage } from '@pages/users/user-form/user-form.page'
import { UserRoutesEnum } from '@pages/users/user-routes.enum'
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page'
import { SettingPage } from '@pages/users/settings/setting/setting.page'
import { ProfilesListPage } from '@pages/users/profiles/profiles-list/profiles-list.page'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'

export const userRoutes: Routes = [
    {
        path: '',
        component: UserPage,
        children: [
            {
                path: '', component: UsersListPage,
            },
            {
                path: UserRoutesEnum.EDIT, component: UserFormPage,
            },
            {
                path: UserRoutesEnum.PROFILES,
                component: ProfilesListPage,
                providers: [ ProjectProfileFacade, ProjectProfileStore ],
            },
            {
                path: UserRoutesEnum.INVITATIONS,
                component: InvitationsListPage,
                providers: [ ProjectProfileFacade, ProjectProfileStore ],
            },
            {
                path: UserRoutesEnum.SETTINGS, component: SettingPage,
            },
        ],
    },
]
