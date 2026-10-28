import { Routes } from '@angular/router'
import { UserPage } from '@pages/users/user.page'
import { UsersListPage } from '@pages/users/users-list/users-list.page'
import { UserFormPage } from '@pages/users/user-form/user-form.page'
import { UserRoutesEnum } from '@pages/users/user-routes.enum'

/**
 * Purpose: Déclare les routes de l'espace des utilisateurs.
 * Scope: Mappe la liste des utilisateurs et son dialogue d'édition, affiché comme route enfant au-dessus de la liste.
 * Limits: Ne détient aucune logique de navigation ; les guards et les pages la possèdent.
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
