import { Routes } from '@angular/router'
import { UserComponent } from './user.component'
import { UsersListComponent } from './users-list/users-list.component'
import { UserFormComponent } from './user-form/user-form.component'
import { UserRoutesEnum } from './user-routes.enum'
import { InvitationsListComponent } from './invitations-list/invitations-list.component'
import { SettingComponent } from './setting/setting.component'

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
                path: UserRoutesEnum.INVITATIONS, component: InvitationsListComponent,
            },
            {
                path: UserRoutesEnum.SETTINGS, component: SettingComponent,
            },
        ],
    },
]
