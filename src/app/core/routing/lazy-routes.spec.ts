import { Route, Routes } from '@angular/router'
import { describe, expect, it } from 'vitest'
import { routes } from '@core/routing/registry.routes'

interface Loaded {
    component: boolean
    children: Routes | undefined
}

async function load (route: Route): Promise<Loaded> {
    const component: unknown = route.loadComponent ? await (route.loadComponent as () => Promise<unknown>)() : undefined
    const children: Routes | undefined = route.loadChildren ? await (route.loadChildren as () => Promise<Routes>)() : undefined
    return { component: component !== undefined, children }
}

async function walk (candidates: Routes): Promise<Loaded[]> {
    const loaded: Loaded[][] = await Promise.all( candidates.map( async (route: Route): Promise<Loaded[]> => {
        const own: Loaded = await load( route )
        const nested: Loaded[] = await walk( [ ...(route.children ?? []), ...(own.children ?? []) ] )
        return (route.loadComponent || route.loadChildren) ? [ own, ...nested ] : nested
    } ) )
    return loaded.flat()
}

describe( 'lazy routes', () => {
    it( 'resolves every lazy component and every lazy child route of the application', async () => {
        // Arrange
        const minimumLoaders: number = 10

        // Act
        const loaded: Loaded[] = await walk( routes )

        // Assert
        expect( loaded.length ).toBeGreaterThanOrEqual( minimumLoaders )
        expect( loaded.every( (it: Loaded): boolean => it.component || (it.children?.length ?? 0) > 0 ) ).toBe( true )
    } )
} )
