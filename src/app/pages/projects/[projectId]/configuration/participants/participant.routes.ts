import { Routes } from '@angular/router';

import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum';

export const participantRoutes: Routes = [
	{
		path: '',
		children: [
			{
				path: '',
				title: 'seo.participants.list',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.page').then(
						(m) => m.ParticipantsListPage,
					),
			},
			{
				path: ParticipantRoutesEnum.CREATE,
				title: 'seo.participants.create',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component').then(
						(m) => m.ParticipantFormComponent,
					),
			},
			{
				path: ParticipantRoutesEnum.EDIT,
				title: 'seo.participants.edit',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component').then(
						(m) => m.ParticipantFormComponent,
					),
			},
			{
				path: ParticipantRoutesEnum.MOVEMENTS,
				title: 'seo.participants.movements',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.page').then(
						(m) => m.ParticipantMovementsListPage,
					),
			},
		],
	},
];
