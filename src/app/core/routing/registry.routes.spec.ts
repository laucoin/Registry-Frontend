import { Route } from '@angular/router'
import { routes } from '@core/routing/registry.routes'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { describe, expect, it } from 'vitest'

describe( 'routes', () => {
    function flatten (candidates: Route[]): Route[] {
        return candidates.flatMap( (route: Route): Route[] => [ route, ...flatten( route.children ?? [] ) ] )
    }

    function lazyRoutes (): Route[] {
        return flatten( routes ).filter( (route: Route): boolean => !!route.loadComponent || !!route.loadChildren )
    }

    it( 'loads the login, auth callback, account, users, projects, privacy and terms areas lazily', () => {
        // Arrange
        const expected: string[] = [
            RegistryRouteEnum.LOGIN,
            RegistryRouteEnum.AUTH_CALLBACK,
            RegistryRouteEnum.MY_ACCOUNT,
            RegistryRouteEnum.PROJECTS,
            RegistryRouteEnum.USERS,
            RegistryRouteEnum.PRIVACY,
            RegistryRouteEnum.TERMS,
        ]

        // Act
        const paths: (string | undefined)[] = lazyRoutes().map( (route: Route): string | undefined => route.path )

        // Assert
        expect( paths ).toEqual( expected )
    } )

    it( 'resolves the lazy pages of the login, auth callback, account, privacy and terms routes', async () => {
        // Arrange
        const loaders: (() => Promise<unknown>)[] = lazyRoutes()
            .filter( (route: Route): boolean => !!route.loadComponent )
            .map( (route: Route): (() => Promise<unknown>) => route.loadComponent as () => Promise<unknown> )

        // Act
        const pages: unknown[] = await Promise.all( loaders.map( (load: () => Promise<unknown>): Promise<unknown> => load() ) )

        // Assert
        expect( pages.map( (page: unknown): string => typeof page ) ).toEqual( [ 'function', 'function', 'function', 'function', 'function' ] )
    } )

    it( 'guards the signed-in areas', () => {
        // Arrange
        const guarded: string[] = [ RegistryRouteEnum.MY_ACCOUNT, RegistryRouteEnum.PROJECTS, RegistryRouteEnum.USERS ]

        // Act
        const unguarded: string[] = guarded.filter(
            (path: string): boolean => !flatten( routes ).find( (route: Route): boolean => route.path === path )?.canActivate?.length,
        )

        // Assert
        expect( unguarded ).toEqual( [] )
    } )
} )
