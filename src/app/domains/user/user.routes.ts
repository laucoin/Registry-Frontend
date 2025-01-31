import { Routes } from '@angular/router'
import { UserComponent } from './user.component'
import { UsersListComponent } from './users-list/users-list.component'
import { UserFormComponent } from './user-form/user-form.component'
import { UserRoutesEnum } from './user-routes.enum'

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
        ],
    },
]
