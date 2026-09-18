import { Routes } from '@angular/router';
import { authGuard } from '@features/auth/auth.guard';
import { guestGuard } from '@features/auth/guest.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('@pages/login/login.page').then(
				(m: typeof import('@pages/login/login.page')) => m.LoginPage,
			),
		canActivate: [guestGuard],
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
	},
	{
		path: 'privacy',
		loadComponent: () =>
			import('@pages/privacy/privacy.page').then(
				(m: typeof import('@pages/privacy/privacy.page')) => m.PrivacyPage,
			),
	},
	{
		path: '',
		loadComponent: () =>
			import('@layout/main-layout/main-layout.component').then(
				(m: typeof import('@layout/main-layout/main-layout.component')) => m.MainLayout,
			),
		children: [
			{
				path: 'home',
				loadComponent: () =>
					import('@pages/home/home.page').then(
						(m: typeof import('@pages/home/home.page')) => m.HomePage,
					),
				canActivate: [authGuard],
			},
			{
				path: '',
				redirectTo: 'home',
				pathMatch: 'full',
			},
		],
	},
];
