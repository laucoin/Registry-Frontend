import { Routes } from '@angular/router'
import { UserComponent } from './user.component'
import { UsersListComponent } from './users-list/users-list.component'

export const userRoutes: Routes = [
    {
        path: '',
        component: UserComponent,
        children: [
            {
                path: '', component: UsersListComponent,
            },
        ],
    },
]
