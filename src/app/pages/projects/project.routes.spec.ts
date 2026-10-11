import { Route } from '@angular/router'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { projectRoutes } from '@pages/projects/project.routes'
import { describe, expect, it } from 'vitest'

describe( 'projectRoutes', () => {
    it( 'provides the project facade and store to every page below the projects area', () => {
        // Arrange
        const root: Route = projectRoutes[ 0 ]

        // Act
        const providers: unknown[] = root.providers ?? []

        // Assert
        expect( providers ).toEqual( [ ProjectFacade, ProjectStore ] )
        expect( root.path ).toBe( '' )
    } )
} )
