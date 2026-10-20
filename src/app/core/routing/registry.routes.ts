import { Routes } from '@angular/router'
import { authGuard } from '@core/authentication/guard/auth.guard'
import { MainComponent } from '@core/layout/main/main.component'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'

/**
 * Purpose: Declares the top-level routes of the application.
 * Scope: Lazy loads each page and applies the authentication guard to the signed-in areas.
 * Limits: Holds no navigation logic; the guards and the pages own it.
 */
export const routes: Routes = [
	{
		path: RegistryRouteEnum.LOGIN,
		loadComponent: () => import('@pages/login/login.page').then((m: typeof import('@pages/login/login.page')) => m.LoginPage),
	},
	{
		path: RegistryRouteEnum.AUTH_CALLBACK,
		loadComponent: () => import('@pages/auth/callback/auth-callback.page').then((m: typeof import('@pages/auth/callback/auth-callback.page')) => m.AuthCallbackPage),
	},
	{
		path: '',
		component: MainComponent,
		children: [
			{
				path: RegistryRouteEnum.MY_ACCOUNT,
				loadChildren: () => import('@pages/my-account/my-account.routes').then((m: typeof import('@pages/my-account/my-account.routes')) => m.myAccountRoutes),
				canActivate: [authGuard],
			},
			{
				path: RegistryRouteEnum.PROJECTS,
				loadChildren: () => import('@pages/projects/project.routes').then((m: typeof import('@pages/projects/project.routes')) => m.projectRoutes),
				canActivate: [authGuard],
			},
			{
				path: RegistryRouteEnum.USERS,
				loadChildren: () => import('@pages/users/user.routes').then((m: typeof import('@pages/users/user.routes')) => m.userRoutes),
				canActivate: [authGuard],
			},
			{
				path: RegistryRouteEnum.PRIVACY,
				loadComponent: () => import('@pages/privacy/privacy.page').then((m: typeof import('@pages/privacy/privacy.page')) => m.PrivacyPage),
			},
			{
				path: RegistryRouteEnum.TERMS,
				loadComponent: () => import('@pages/terms/terms.page').then((m: typeof import('@pages/terms/terms.page')) => m.TermsPage),
			},
			{
				path: '**',
				redirectTo: RegistryRouteEnum.PROJECTS,
			},
		],
	},
]
