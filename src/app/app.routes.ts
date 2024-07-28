import { Routes } from '@angular/router'
import { AppRoutesEnum } from './shared/model/app-routes.enum'
import { HomeComponent } from './shell/home/home.component'
import { AuthCallbackComponent } from './shell/auth-callback/auth-callback.component'
import { SilentAuthCallbackComponent } from './shell/silent-auth-callback/silent-auth-callback.component'
import { authGuard } from './shared/util-auth/guard/auth.guard'

export const routes: Routes = [
    {
        path: AppRoutesEnum.HOME,
        component: HomeComponent,
        canActivate: [ authGuard ],
    },
    {
        path: AppRoutesEnum.AUTH_CALLBACK,
        component: AuthCallbackComponent,
    },
    {
        path: AppRoutesEnum.SILENT_AUTH_CALLBACK,
        component: SilentAuthCallbackComponent,
    },
    {
        path: '**',
        pathMatch: 'full',
        redirectTo: AppRoutesEnum.HOME,
    },
]
