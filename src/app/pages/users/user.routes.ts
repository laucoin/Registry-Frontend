import { Routes } from '@angular/router'
import { UserComponent } from '@pages/users/user.component'
import { UsersListComponent } from '@pages/users/users-list/users-list.component'
import { UserFormComponent } from '@pages/users/user-form/user-form.component'
import { UserRoutesEnum } from '@pages/users/user-routes.enum'
import { InvitationsListComponent } from '@pages/users/invitations/invitations-list/invitations-list.component'
import { SettingComponent } from '@pages/users/settings/setting/setting.component'
import { ProfilesListComponent } from '@pages/users/profiles/profiles-list/profiles-list.component'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileState } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.state'

export const userRoutes: Routes = [
    {
        path: '',
        component: UserComponent,
        children: [
            {
                path: '', component: UsersListComponent,
            },
            {
                path: UserRoutesEnum.EDIT, component: UserFormComponent,
            },
            {
                path: UserRoutesEnum.PROFILES,
                component: ProfilesListComponent,
                providers: [ ProjectProfileFacade, importProvidersFrom( NgxsModule.forFeature( [ ProjectProfileState ] ) ) ],
            },
            {
                path: UserRoutesEnum.INVITATIONS,
                component: InvitationsListComponent,
                providers: [ ProjectProfileFacade, importProvidersFrom( NgxsModule.forFeature( [ ProjectProfileState ] ) ) ],
            },
            {
                path: UserRoutesEnum.SETTINGS, component: SettingComponent,
            },
        ],
    },
]
