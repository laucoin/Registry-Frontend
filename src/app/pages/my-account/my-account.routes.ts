import { Routes } from '@angular/router'
import { MyAccountPage } from '@pages/my-account/my-account.page'
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page'
import { ProfilesListPage } from '@pages/users/profiles/profiles-list/profiles-list.page'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'

/**
 * Purpose: Declares the routes of the my-account area.
 * Scope: Maps the account page, the user's project profiles and the user's invitations.
 * Limits: Holds no navigation logic; the guards and the pages own it.
 */
export const myAccountRoutes: Routes = [
    { path: '', component: MyAccountPage },
    {
        path: 'projects',
        component: ProfilesListPage,
        providers: [ ProjectProfileFacade, ProjectProfileStore ],
    },
    {
        path: 'invitations',
        component: InvitationsListPage,
        providers: [ ProjectProfileFacade, ProjectProfileStore ],
    },
]
