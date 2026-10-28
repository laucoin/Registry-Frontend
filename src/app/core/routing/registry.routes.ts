import { Routes } from '@angular/router'
import { authGuard } from '@core/authentication/guard/auth.guard'
import { MainComponent } from '@core/layout/main/main.component'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { RouteSeoModel, SEO_DATA_KEY } from '@core/seo/route-seo.model'

/**
 * Purpose: Déclare les routes de premier niveau de l'application.
 * Scope: Charge chaque page paresseusement et applique le guard d'authentification aux espaces connectés.
 * Limits: Ne détient aucune logique de navigation ; les guards et les pages la possèdent.
 */
export const routes: Routes = [
	{
		path: RegistryRouteEnum.LOGIN,
		title: 'seo.login.title',
		data: { [SEO_DATA_KEY]: { descriptionKey: 'seo.login.description' } satisfies RouteSeoModel },
		loadComponent: () => import('@pages/login/login.page').then((m: typeof import('@pages/login/login.page')) => m.LoginPage),
	},
	{
		path: RegistryRouteEnum.AUTH_CALLBACK,
		title: 'seo.authCallback',
		loadComponent: () => import('@pages/auth/callback/auth-callback.page').then((m: typeof import('@pages/auth/callback/auth-callback.page')) => m.AuthCallbackPage),
	},
	{
		path: '',
		component: MainComponent,
		children: [
			{
				path: '',
				pathMatch: 'full',
				loadChildren: () => import('@pages/home/home.routes').then((m: typeof import('@pages/home/home.routes')) => m.homeRoutes),
				canActivate: [authGuard],
			},
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
				title: 'seo.privacy.title',
				data: { [SEO_DATA_KEY]: { descriptionKey: 'seo.privacy.description' } satisfies RouteSeoModel },
				loadComponent: () => import('@pages/privacy/privacy.page').then((m: typeof import('@pages/privacy/privacy.page')) => m.PrivacyPage),
			},
			{
				path: RegistryRouteEnum.TERMS,
				title: 'seo.terms.title',
				data: { [SEO_DATA_KEY]: { descriptionKey: 'seo.terms.description' } satisfies RouteSeoModel },
				loadComponent: () => import('@pages/terms/terms.page').then((m: typeof import('@pages/terms/terms.page')) => m.TermsPage),
			},
			{
				path: '**',
				redirectTo: '',
			},
		],
	},
]
