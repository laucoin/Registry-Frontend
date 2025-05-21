import { Routes } from '@angular/router'
import { AppRouteEnum } from './app-route.enum'
import { AuthCallbackComponent } from './shell/auth-callback/auth-callback.component'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { ProjectState } from './domains/project/data/state/project/project.state'
import { ProjectFacade } from './domains/project/data/state/project/project.facade'
import { authGuard } from './shared/util-authentication/guard/auth.guard'

export const routes: Routes = [
    {
        path: AppRouteEnum.PROJECTS,
        loadChildren: () => import('./domains/project/project.routes').then( (m: typeof import('./domains/project/project.routes')) => m.projectRoutes ),
        canActivate: [ authGuard ],
        providers: [ ProjectFacade, importProvidersFrom( NgxsModule.forFeature( [ ProjectState ] ) ) ],
    },
    {
        path: AppRouteEnum.USERS,
        loadChildren: () => import('./domains/user/user.routes').then( (m: typeof import('./domains/user/user.routes')) => m.userRoutes ),
        canActivate: [ authGuard ],
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
