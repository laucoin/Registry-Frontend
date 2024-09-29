import { Routes } from '@angular/router'
import { PreferencesComponent } from './preferences.component'
import { PreferencesRoutesEnum } from './preferences-routes.enum'
import { ProfileListComponent } from './profile-list/profile-list.component'
import { InvitationListComponent } from './invitation-list/invitation-list.component'

export const preferencesRoutes: Routes = [
    {
        path: '',
        component: PreferencesComponent,
        children: [
            {
                path: PreferencesRoutesEnum.PROFILES,
                component: ProfileListComponent,
            },
            {
                path: PreferencesRoutesEnum.INVITATIONS,
                component: InvitationListComponent,
            },
            {
                path: '**',
                pathMatch: 'full',
                redirectTo: PreferencesRoutesEnum.PROFILES,
            },
        ],
    },
]
