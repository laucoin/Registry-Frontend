import { Route } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { MyAccountPage } from '@pages/my-account/my-account.page'
import { myAccountRoutes } from '@pages/my-account/my-account.routes'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page'
import { describe, expect, it } from 'vitest'

describe( 'myAccountRoutes', () => {
    function routeOf (path: string): Route {
        return myAccountRoutes.find( (route: Route): boolean => route.path === path )!
    }

    it( 'serves the account and invitations pages', () => {
        // Arrange
        const expected: unknown[] = [ MyAccountPage, InvitationsListPage ]

        // Act
        const components: unknown[] = myAccountRoutes.map( (route: Route): unknown => route.component )

        // Assert
        expect( components ).toEqual( expected )
    } )

    it( 'exposes the paths used by the account routes of the registry', () => {
        // Arrange
        const paths: string[] = [ RegistryRouteEnum.MY_ACCOUNT_INVITATIONS ]

        // Act
        const relative: string[] = paths.map( (path: string): string => path.replace( `${RegistryRouteEnum.MY_ACCOUNT}/`, '' ) )

        // Assert
        expect( relative.every( (path: string): boolean => !!routeOf( path ) ) ).toBe( true )
    } )

    it( 'provides the project profile facade and store to the invitations page', () => {
        // Arrange
        const invitations: Route = routeOf( 'invitations' )

        // Act
        const providers: unknown[] = invitations.providers ?? []

        // Assert
        expect( providers ).toEqual( [ ProjectProfileFacade, ProjectProfileStore ] )
    } )
} )
