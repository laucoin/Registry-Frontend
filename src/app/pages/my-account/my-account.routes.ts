import { Routes } from '@angular/router'
import { MyAccountPage } from '@pages/my-account/my-account.page'
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'

/**
 * Purpose: Déclare les routes de l'espace mon compte.
 * Scope: Mappe la page de compte et les invitations de l'utilisateur.
 * Limits: Ne détient aucune logique de navigation ; les guards et les pages la possèdent.
 */
export const myAccountRoutes: Routes = [
    { path: '', title: 'seo.myAccount', component: MyAccountPage },
    {
        path: 'invitations',
        title: 'seo.invitations',
        component: InvitationsListPage,
        providers: [ ProjectProfileFacade, ProjectProfileStore ],
    },
]
