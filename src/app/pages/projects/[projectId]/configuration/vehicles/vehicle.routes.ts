import { Routes } from '@angular/router';

import { VehicleRoutesEnum } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-routes.enum';

export const vehicleRoutes: Routes = [
	{
		path: '',
		children: [
			{
				path: '',
				title: 'seo.vehicles.list',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.page').then(
						(m) => m.VehiclesListPage,
					),
				children: [
					{
						path: VehicleRoutesEnum.CREATE,
						title: 'seo.vehicles.create',
						loadComponent: () =>
							import('@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle-form.page').then(
								(m) => m.VehicleFormPage,
							),
					},
					{
						path: VehicleRoutesEnum.EDIT,
						title: 'seo.vehicles.edit',
						loadComponent: () =>
							import('@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle-form.page').then(
								(m) => m.VehicleFormPage,
							),
					},
				],
			},
			{
				path: VehicleRoutesEnum.MOVEMENTS,
				title: 'seo.vehicles.movements',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.page').then(
						(m) => m.VehicleMovementsListPage,
					),
			},
		],
	},
];
