import { Routes } from '@angular/router'
import { MyAccountPage } from '@pages/my-account/my-account.page'
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'

/**
 * Purpose: Declares the routes of the my-account area.
 * Scope: Maps the account page and the user's invitations.
 * Limits: Holds no navigation logic; the guards and the pages own it.
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
