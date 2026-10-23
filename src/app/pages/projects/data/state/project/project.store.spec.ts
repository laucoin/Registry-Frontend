import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ProjectModel } from '@shared/models/model/project.model'

describe( 'ProjectStore', () => {
    let store: InstanceType<typeof ProjectStore>
    let findProjects: Mock<ProjectApi['findProjects']>
    let findProjectById: Mock<ProjectApi['findProjectById']>
    let getAvailableProjectOptions: Mock<ProjectApi['getAvailableProjectOptions']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findProjects = vi.fn()
        findProjectById = vi.fn()
        getAvailableProjectOptions = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ProjectStore,
                { provide: ProjectApi, useValue: { findProjects, findProjectById, getAvailableProjectOptions } },
                { provide: ErrorReporter, useValue: { notify } },
            ],
        } )
        store = TestBed.inject( ProjectStore )
    } )

    it( 'stores the fetched projects page', () => {
        // Arrange
        findProjects.mockReturnValue( of( pageOf<ProjectModel>( [ { id: 'p1' } as ProjectModel ] ) ) )

        // Act
        store.fetchProjectsPage( { page: 0, size: 10 } )

        // Assert
        expect( store.projects.element()?.content ).toHaveLength( 1 )
        expect( store.projects.loading() ).toBe( false )
    } )

    it( 'updates the favorite of one shown project without refetching', () => {
        // Arrange
        findProjects.mockReturnValue( of( pageOf<ProjectModel>( [ { id: 'p1', favorite: false } as ProjectModel, { id: 'p2', favorite: false } as ProjectModel ] ) ) )
        store.fetchProjectsPage( { page: 0, size: 10 } )
        findProjects.mockClear()

        // Act
        store.setProjectFavorite( 'p2', true )

        // Assert
        expect( store.projects.element()?.content.map( (project: ProjectModel): boolean | undefined => project.favorite ) ).toEqual( [ false, true ] )
        expect( findProjects ).not.toHaveBeenCalled()
    } )

    it( 'ignores a favorite change when no page is shown', () => {
        // Arrange
        const projectId: string = 'p1'

        // Act
        store.setProjectFavorite( projectId, true )

        // Assert
        expect( store.projects.element() ).toBeUndefined()
    } )

    it( 'keeps a failed projects fetch in the projects block', () => {
        // Arrange
        findProjects.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchProjectsPage( { page: 0, size: 10 } )

        // Assert
        expect( store.projects.error()?.summary ).toBe( 'Title' )
    } )

    it( 'keeps a 503 failure in its block', () => {
        // Arrange
        findProjects.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchProjectsPage( { page: 0, size: 10 } )

        // Assert
        expect( store.projects.error() ).toBeDefined()
    } )

    it( 'stores the available project options', () => {
        // Arrange
        const options: ProjectOptionModel[] = [ { label: 'Vehicles', value: 'VEHICLE' } as unknown as ProjectOptionModel ]
        getAvailableProjectOptions.mockReturnValue( of( options ) )

        // Act
        store.fetchProjectOptions()

        // Assert
        expect( store.metadata.options() ).toEqual( options )
    } )

    it( 'keeps the failure of the project options in the section error', () => {
        // Arrange
        getAvailableProjectOptions.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchProjectOptions()

        // Assert
        expect( store.sectionErrors()[ 'metadata.options' ]?.summary ).toBe( 'Title' )
        expect( store.metadata.options() ).toEqual( [] )
    } )

    it( 'loads a single project then forgets it on reset', () => {
        // Arrange
        findProjectById.mockReturnValue( of( { id: 'p1', name: 'Camp' } as ProjectModel ) )
        store.fetchProject( 'p1' )
        const loaded: string | undefined = store.project.element()?.name

        // Act
        store.resetProject()

        // Assert
        expect( loaded ).toBe( 'Camp' )
        expect( store.project.element() ).toBeUndefined()
    } )

    it( 'remembers the id of the created project', () => {
        // Arrange
        const id: string = 'p9'

        // Act
        store.setCreatedProjectId( id )

        // Assert
        expect( store.createdProjectId() ).toBe( 'p9' )
    } )

    it( 'toggles the project loader', () => {
        // Arrange
        store.startProjectLoader()
        const running: boolean = store.project.loading()

        // Act
        store.stopProjectLoader()

        // Assert
        expect( running ).toBe( true )
        expect( store.project.loading() ).toBe( false )
    } )
} )
