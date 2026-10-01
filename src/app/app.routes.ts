import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { guestGuard } from '@core/auth/guest.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('@pages/login/login.page').then(
				(m: typeof import('@pages/login/login.page')) => m.LoginPage,
			),
		canActivate: [guestGuard],
		data: { title: 'login.documentTitle' },
	},
	{
		path: 'auth/callback',
		loadComponent: () =>
			import('@pages/auth-callback/auth-callback.page').then(
				(m: typeof import('@pages/auth-callback/auth-callback.page')) => m.AuthCallbackPage,
			),
	},
	{
		path: 'terms',
		loadComponent: () =>
			import('@pages/terms/terms.page').then(
				(m: typeof import('@pages/terms/terms.page')) => m.TermsPage,
			),
		data: { title: 'terms.title' },
	},
	{
		path: 'privacy',
		loadComponent: () =>
			import('@pages/privacy/privacy.page').then(
				(m: typeof import('@pages/privacy/privacy.page')) => m.PrivacyPage,
			),
		data: { title: 'privacy.title' },
	},
	{
		path: '',
		loadComponent: () =>
			import('@core/layout/main/main.component').then(
				(m: typeof import('@core/layout/main/main.component')) => m.MainComponent,
			),
		canActivate: [authGuard],
		children: [
			{
				path: 'home',
				loadComponent: () =>
					import('@pages/home/home.page').then(
						(m: typeof import('@pages/home/home.page')) => m.HomePage,
					),
				data: { title: 'home.documentTitle' },
			},
			{
				path: 'my-account',
				loadComponent: () =>
					import('@pages/my-account/my-account.page').then(
						(m: typeof import('@pages/my-account/my-account.page')) => m.MyAccountPage,
					),
				data: { title: 'myAccount.title' },
			},
			{
				path: 'my-accesses',
				loadComponent: () =>
					import('@pages/my-accesses/my-accesses.page').then(
						(m: typeof import('@pages/my-accesses/my-accesses.page')) => m.MyAccessesPage,
					),
				data: { title: 'myAccesses.title' },
			},
			{
				path: 'projects',
				loadComponent: () =>
					import('@pages/projects/projects.page').then(
						(m: typeof import('@pages/projects/projects.page')) => m.ProjectsPage,
					),
				data: { title: 'projects.title' },
			},
			{
				path: 'projects/:id',
				children: [
					{
						path: 'home',
						loadComponent: () =>
							import('@pages/projects/[id]/home/project-home.page').then(
								(m: typeof import('@pages/projects/[id]/home/project-home.page')) =>
									m.ProjectHomePage,
							),
						data: { title: 'projectHome.documentTitle' },
					},
					{ path: '', redirectTo: 'home', pathMatch: 'full' },
				],
			},
			{
				path: 'users',
				loadComponent: () =>
					import('@pages/users/users.page').then(
						(m: typeof import('@pages/users/users.page')) => m.UsersPage,
					),
				data: { title: 'users.title' },
			},
			{
				path: '',
				redirectTo: 'home',
				pathMatch: 'full',
			},
		],
	},
];
