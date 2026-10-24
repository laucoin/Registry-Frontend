import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectApi } from '@core/registry/state/project.api'
import { HomeStore } from '@pages/home/data/state/home.store'
import { ERROR_500, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ProjectModel } from '@shared/models/model/project.model'

describe( 'HomeStore', () => {
    let store: InstanceType<typeof HomeStore>
    let findProjects: Mock<ProjectApi['findProjects']>

    beforeEach( () => {
        findProjects = vi.fn( () => of( pageOf<ProjectModel>( [ { id: 'p1' } as ProjectModel ] ) ) )
        TestBed.configureTestingModule( {
            providers: [
                HomeStore,
                { provide: ProjectApi, useValue: { findProjects } },
                { provide: ErrorReporter, useValue: { notify: vi.fn() } },
            ],
        } )
        store = TestBed.inject( HomeStore )
    } )

    it( 'asks for the favorite projects sorted by name', () => {
        // Arrange
        const request: { page: number, size: number } = { page: 0, size: 5 }

        // Act
        store.fetchFavorites( request )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 0, 5, expect.objectContaining( { isFavorite: true, sort: 'name' } ) )
        expect( store.favorites.element()?.content ).toHaveLength( 1 )
    } )

    it( 'asks for the projects with the most active alerts first', () => {
        // Arrange
        const request: { page: number, size: number } = { page: 0, size: 5 }

        // Act
        store.fetchAttention( request )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 0, 5, expect.objectContaining( { sort: '-activeAlerts' } ) )
        expect( store.attention.element()?.content ).toHaveLength( 1 )
    } )

    it( 'keeps a failed fetch in its block only', () => {
        // Arrange
        findProjects.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchFavorites( { page: 0, size: 5 } )

        // Assert
        expect( store.favorites.error()?.summary ).toBe( 'Title' )
        expect( store.attention.error() ).toBeUndefined()
    } )

    it( 'keeps working after a failed fetch', () => {
        // Arrange
        findProjects.mockReturnValueOnce( failing( ERROR_500 ) )
        store.fetchFavorites( { page: 0, size: 5 } )

        // Act
        store.fetchFavorites( { page: 0, size: 5 } )

        // Assert
        expect( store.favorites.element()?.content ).toHaveLength( 1 )
    } )

    it( 'refreshes silently without flagging the block as loading', () => {
        // Arrange
        store.fetchAttention( { page: 0, size: 5 } )
        findProjects.mockReturnValue( of( pageOf<ProjectModel>( [ { id: 'p2' } as ProjectModel ] ) ) )

        // Act
        store.refreshAttention( { page: 0, size: 5 } )

        // Assert
        expect( store.attention.element()?.content[ 0 ].id ).toBe( 'p2' )
        expect( store.attention.loading() ).toBe( false )
    } )

    it( 'keeps the displayed page when a silent refresh of the favorites fails', () => {
        // Arrange
        store.fetchFavorites( { page: 0, size: 5 } )
        findProjects.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.refreshFavorites( { page: 0, size: 5 } )

        // Assert
        expect( store.favorites.element()?.content[ 0 ].id ).toBe( 'p1' )
        expect( store.favorites.error() ).toBeUndefined()
    } )

    it( 'resets both blocks to their initial state', () => {
        // Arrange
        store.fetchFavorites( { page: 0, size: 5 } )
        store.fetchAttention( { page: 0, size: 5 } )

        // Act
        store.reset()

        // Assert
        expect( store.favorites.element() ).toBeUndefined()
        expect( store.attention.element() ).toBeUndefined()
    } )
} )
