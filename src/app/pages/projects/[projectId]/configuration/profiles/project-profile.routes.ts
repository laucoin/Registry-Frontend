import { Routes } from '@angular/router';

import { ProjectProfileRoutesEnum } from '@pages/projects/[projectId]/configuration/profiles/project-profile-routes.enum';

export const projectProfileRoutes: Routes = [
	{
		path: '',
		children: [
			{
				path: '',
				title: 'seo.profiles.list',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.page').then(
						(m) => m.ProjectProfilesListPage,
					),
				children: [
					{
						path: ProjectProfileRoutesEnum.EDIT,
						title: 'seo.profiles.edit',
						loadComponent: () =>
							import('@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/project-profile-edition-form.page').then(
								(m) => m.ProjectProfileEditionFormPage,
							),
					},
				],
			},
			{
				path: ProjectProfileRoutesEnum.INVITE,
				title: 'seo.profiles.invite',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-form/project-profile-invitation-form.page').then(
						(m) => m.ProjectProfileInvitationFormPage,
					),
			},
		],
	},
];
