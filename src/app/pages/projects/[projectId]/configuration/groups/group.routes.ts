import { Routes } from '@angular/router';

import { GroupRoutesEnum } from '@pages/projects/[projectId]/configuration/groups/group-routes.enum';

export const groupRoutes: Routes = [
	{
		path: '',
		children: [
			{
				path: '',
				title: 'seo.groups.list',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.page').then(
						(m) => m.GroupsListPage,
					),
			},
			{
				path: GroupRoutesEnum.MEMBERS,
				title: 'seo.groups.members',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.page').then(
						(m) => m.GroupMemberListPage,
					),
			},
			{
				path: GroupRoutesEnum.CREATE,
				title: 'seo.groups.create',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/groups/group-form/group-form.page').then(
						(m) => m.GroupFormPage,
					),
			},
			{
				path: GroupRoutesEnum.EDIT,
				title: 'seo.groups.edit',
				loadComponent: () =>
					import('@pages/projects/[projectId]/configuration/groups/group-form/group-form.page').then(
						(m) => m.GroupFormPage,
					),
			},
		],
	},
];
