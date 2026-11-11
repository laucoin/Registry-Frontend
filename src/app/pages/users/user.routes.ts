import { Routes } from '@angular/router';

import { UserFacade } from '@pages/users/data/state/user.facade';
import { UserStore } from '@pages/users/data/state/user.store';
import { UserFormPage } from '@pages/users/user-form/user-form.page';
import { UserRoutesEnum } from '@pages/users/user-routes.enum';
import { UsersListPage } from '@pages/users/users-list/users-list.page';

/**
 * Objectif: Déclare les routes de l'espace des utilisateurs.
 * Périmètre: Mappe la liste des utilisateurs et son dialogue d'édition, affiché comme route enfant au-dessus de la liste.
 * Limites: Ne détient aucune logique de navigation ; les guards et les pages la possèdent.
 */
export const userRoutes: Routes = [
	{
		path: '',
		providers: [UserFacade, UserStore],
		children: [
			{
				path: '',
				title: 'seo.users.list',
				component: UsersListPage,
				children: [{ path: UserRoutesEnum.EDIT, title: 'seo.users.edit', component: UserFormPage }],
			},
		],
	},
];
