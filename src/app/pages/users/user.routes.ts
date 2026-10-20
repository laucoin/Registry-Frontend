import { Routes } from '@angular/router'
import { UserPage } from '@pages/users/user.page'
import { UsersListPage } from '@pages/users/users-list/users-list.page'
import { UserFormPage } from '@pages/users/user-form/user-form.page'
import { UserRoutesEnum } from '@pages/users/user-routes.enum'

/**
 * Purpose: Declares the routes of the users area.
 * Scope: Maps the users list, edition form pages.
 * Limits: Holds no navigation logic; the guards and the pages own it.
 */
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
        ],
    },
]
