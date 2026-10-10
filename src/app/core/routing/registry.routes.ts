import { Routes } from '@angular/router'
import { authGuard } from '@core/authentication/guard/auth.guard'
import { MainComponent } from '@core/layout/main/main.component'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { AuthCallbackPage } from '@pages/auth/callback/auth-callback.page'
import { MyAccountPage } from "@pages/my-account/my-account.page";
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'

export const routes: Routes = [
	{
		path: RegistryRouteEnum.LOGIN,
		loadComponent: () => import('@pages/login/login.page').then((m: typeof import('@pages/login/login.page')) => m.LoginPage),
	},
	{
		path: RegistryRouteEnum.AUTH_CALLBACK,
		component: AuthCallbackPage,
	},
	{
		path: '',
		component: MainComponent,
		children: [
			{
				path: RegistryRouteEnum.MY_ACCOUNT,
				component: MyAccountPage,
				canActivate: [authGuard],
			},
			{
				path: RegistryRouteEnum.PROJECTS,
				loadChildren: () => import('@pages/projects/project.routes').then((m: typeof import('@pages/projects/project.routes')) => m.projectRoutes),
				canActivate: [authGuard],
				providers: [ProjectFacade, ProjectStore],
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
