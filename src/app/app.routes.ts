import { Routes } from '@angular/router'
import { AppRouteEnum } from './app-route.enum'
import { authGuard } from './shared/util-authentication/guard/auth.guard'
import { selectedProfileGuard } from './shared/util-authentication/guard/selected-profile.guard'
import { HomeComponent } from './shell/home/home.component'
import { AuthCallbackComponent } from './shell/auth-callback/auth-callback.component'
import { importProvidersFrom } from '@angular/core'
import { NgxsModule } from '@ngxs/store'
import { EventState } from './domains/event/data/state/event.state'
import { EventProfileState } from './domains/event-profile/data/state/event-profile.state'
import { ParticipantState } from './domains/participant/data/state/participant.state'
import { MovementState } from './domains/movement/data/state/movement.state'
import { EventFacade } from './domains/event/data/state/event.facade'
import { EventProfileFacade } from './domains/event-profile/data/state/event-profile.facade'
import { ParticipantFacade } from './domains/participant/data/state/participant.facade'
import { MovementFacade } from './domains/movement/data/state/movement.facade'
import { SignOutCallbackComponent } from './shell/sign-out-callback/sign-out-callback.component'

export const routes: Routes = [
    {
        path: AppRouteEnum.HOME,
        component: HomeComponent,
        canActivate: [ authGuard ],
    },
    {
        path: AppRouteEnum.AUTH_CALLBACK,
        component: AuthCallbackComponent,
    },
    {
        path: AppRouteEnum.LOGOUT_CALLBACK,
        component: SignOutCallbackComponent,
    },
    {
        path: AppRouteEnum.USERS,
        loadChildren: () => import('./domains/user/user.routes').then( (m: typeof import('./domains/user/user.routes')) => m.userRoutes ),
        canActivate: [ authGuard ],
    },
    {
        path: AppRouteEnum.PREFERENCES,
        loadChildren: () => import('./domains/preferences/preferences.routes').then( (m: typeof import('./domains/preferences/preferences.routes')) => m.preferencesRoutes ),
        canActivate: [ authGuard ],
    },
    {
        path: AppRouteEnum.EVENTS,
        loadChildren: () => import('./domains/event/event.routes').then( (m: typeof import('./domains/event/event.routes')) => m.eventRoutes ),
        canActivate: [ authGuard ],
        providers: [ EventFacade, importProvidersFrom( NgxsModule.forFeature( [ EventState ] ) ) ],
    },
    {
        path: AppRouteEnum.MOVEMENTS,
        loadChildren: () => import('./domains/movement/movement.routes').then( (m: typeof import('./domains/movement/movement.routes')) => m.movementRoutes ),
        canActivate: [ authGuard, selectedProfileGuard ],
        providers: [ MovementFacade, ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ MovementState, ParticipantState ] ) ) ],
    },
    {
        path: AppRouteEnum.PROFILES,
        loadChildren: () => import('./domains/event-profile/event-profile.routes').then( (m: typeof import('./domains/event-profile/event-profile.routes')) => m.eventProfileRoutes ),
        canActivate: [ authGuard, selectedProfileGuard ],
        providers: [ EventProfileFacade, importProvidersFrom( NgxsModule.forFeature( [ EventProfileState ] ) ) ],
    },
    {
        path: AppRouteEnum.PARTICIPANTS,
        loadChildren: () => import('./domains/participant/participant.routes').then( (m: typeof import('./domains/participant/participant.routes')) => m.participantRoutes ),
        canActivate: [ authGuard, selectedProfileGuard ],
        providers: [ ParticipantFacade, importProvidersFrom( NgxsModule.forFeature( [ ParticipantState ] ) ) ],
    },
    {
        path: '**', pathMatch: 'full', redirectTo: AppRouteEnum.HOME,
    },
]
