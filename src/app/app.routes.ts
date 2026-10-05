import { importProvidersFrom } from '@angular/core'
import { Routes } from '@angular/router'
import { NgxsModule } from '@ngxs/store'
import { AppRouteEnum } from './app-route.enum'
import { ProjectFacade } from './domains/project/data/state/project/project.facade'
import { ProjectState } from './domains/project/data/state/project/project.state'
import { authGuard } from './shared/util-authentication/guard/auth.guard'
import { AuthCallbackComponent } from './shell/auth-callback/auth-callback.component'

export const routes: Routes = [
	{
		path: AppRouteEnum.PROJECTS,
		loadChildren: () => import('./domains/project/project.routes').then((m: typeof import('./domains/project/project.routes')) => m.projectRoutes),
		canActivate: [authGuard],
		providers: [ProjectFacade, importProvidersFrom(NgxsModule.forFeature([ProjectState]))],
	},
	{
		path: AppRouteEnum.USERS,
		loadChildren: () => import('./domains/user/user.routes').then((m: typeof import('./domains/user/user.routes')) => m.userRoutes),
		canActivate: [authGuard],
	},
	{
		path: AppRouteEnum.AUTH_CALLBACK,
		component: AuthCallbackComponent,
	},
	{
		path: '**',
		redirectTo: AppRouteEnum.PROJECTS,
	},
]
