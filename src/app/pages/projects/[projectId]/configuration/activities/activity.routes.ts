import { Routes } from '@angular/router';

import { ActivityRoutesEnum } from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum';

export const activityRoutes: Routes = [
	{
		path: '',
		children: [
			{
				path: '',
				title: 'seo.activities.list',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.page').then(
						(m) => m.ActivitiesListPage,
					),
				children: [
					{
						path: ActivityRoutesEnum.CREATE,
						title: 'seo.activities.create',
						loadComponent: () =>
							import('@pages/projects/[projectId]/configuration/activities/activity-form/activity-form.page').then(
								(m) => m.ActivityFormPage,
							),
					},
					{
						path: ActivityRoutesEnum.EDIT,
						title: 'seo.activities.edit',
						loadComponent: () =>
							import('@pages/projects/[projectId]/configuration/activities/activity-form/activity-form.page').then(
								(m) => m.ActivityFormPage,
							),
					},
				],
			},
			{
				path: ActivityRoutesEnum.MOVEMENTS,
				title: 'seo.activities.movements',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.page').then(
						(m) => m.ActivityMovementsListPage,
					),
			},
		],
	},
];
