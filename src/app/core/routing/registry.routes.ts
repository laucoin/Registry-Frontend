import { Routes } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { AuthCallbackPage } from '@pages/auth/callback/auth-callback.page'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { authGuard } from '@core/authentication/guard/auth.guard'

export const routes: Routes = [
    {
        path: RegistryRouteEnum.PROJECTS,
        loadChildren: () => import('@pages/projects/project.routes').then( (m: typeof import('@pages/projects/project.routes')) => m.projectRoutes ),
        canActivate: [ authGuard ],
        providers: [ ProjectFacade, importProvidersFrom( NgxsModule.forFeature( [ ProjectStore ] ) ) ],
    },
    {
        path: RegistryRouteEnum.USERS,
        loadChildren: () => import('@pages/users/user.routes').then( (m: typeof import('@pages/users/user.routes')) => m.userRoutes ),
        canActivate: [ authGuard ],
    },
    {
        path: RegistryRouteEnum.AUTH_CALLBACK,
        component: AuthCallbackPage,
    },
    {
        path: '**',
        redirectTo: RegistryRouteEnum.PROJECTS,
    },
]
