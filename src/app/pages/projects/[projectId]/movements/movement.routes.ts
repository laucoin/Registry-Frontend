import { Routes } from '@angular/router';

import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum';

export const movementRoutes: Routes = [
	{
		path: '',
		children: [
			{
				path: '',
				title: 'seo.movements.list',
				loadComponent: () =>
					import('@pages/projects/[projectId]/movements/movements-list/movements-list.page').then(
						(m) => m.MovementsListPage,
					),
			},
			{
				path: MovementRoutesEnum.CREATE_REGISTERED,
				title: 'seo.movements.createRegistered',
				loadComponent: () =>
					import('@pages/projects/[projectId]/movements/movement-form/registered/registered-movement-form.page').then(
						(m) => m.RegisteredMovementFormPage,
					),
			},
			{
				path: MovementRoutesEnum.EDIT_REGISTERED,
				title: 'seo.movements.editRegistered',
				loadComponent: () =>
					import('@pages/projects/[projectId]/movements/movement-form/registered/registered-movement-form.page').then(
						(m) => m.RegisteredMovementFormPage,
					),
			},
			{
				path: MovementRoutesEnum.CREATE_GUEST,
				title: 'seo.movements.createGuest',
				loadComponent: () =>
					import('@pages/projects/[projectId]/movements/movement-form/guest/guest-movement-form.page').then(
						(m) => m.GuestMovementFormPage,
					),
			},
			{
				path: MovementRoutesEnum.EDIT_GUEST,
				title: 'seo.movements.editGuest',
				loadComponent: () =>
					import('@pages/projects/[projectId]/movements/movement-form/guest/guest-movement-form.page').then(
						(m) => m.GuestMovementFormPage,
					),
			},
		],
	},
];
