import { Routes } from '@angular/router'
import { UserPage } from '@pages/users/user.page'
import { UsersListPage } from '@pages/users/users-list/users-list.page'
import { UserFormPage } from '@pages/users/user-form/user-form.page'
import { UserRoutesEnum } from '@pages/users/user-routes.enum'

/**
 * Purpose: Declares the routes of the users area.
 * Scope: Maps the users list and its edition dialog, shown as a child route over the list.
 * Limits: Holds no navigation logic; the guards and the pages own it.
 */
export const userRoutes: Routes = [
    {
        path: '',
        component: UserPage,
        children: [
            {
                path: '', title: 'seo.users.list', component: UsersListPage,
                children: [
                    { path: UserRoutesEnum.EDIT, title: 'seo.users.edit', component: UserFormPage },
                ],
            },
        ],
    },
]
