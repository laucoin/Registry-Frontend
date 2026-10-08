import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectModel } from '@shared/models/model/project.model'

describe( 'ProjectStore', () => {
    let store: InstanceType<typeof ProjectStore>
    let findProjects: Mock<ProjectApi['findProjects']>
    let findProjectById: Mock<ProjectApi['findProjectById']>
    let getAvailableProjectOptions: Mock<ProjectApi['getAvailableProjectOptions']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findProjects = vi.fn()
        findProjectById = vi.fn()
        getAvailableProjectOptions = vi.fn()
        setGlobalError = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ProjectStore,
                { provide: ProjectApi, useValue: { findProjects, findProjectById, getAvailableProjectOptions } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify } },
            ],
        } )
        store = TestBed.inject( ProjectStore )
    } )

    it( 'starts looking for the projects the user has a profile on', () => {
        // Arrange
        const expected: boolean = true

        // Act
        const withProfile: boolean | undefined = store.projects.params.withProfile()

        // Assert
        expect( withProfile ).toBe( expected )
    } )

    it( 'stores the fetched projects page', () => {
        // Arrange
        findProjects.mockReturnValue( of( pageOf<ProjectModel>( [ { id: 'p1' } as ProjectModel ] ) ) )

        // Act
        store.fetchProjectsPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.projects.element()?.content ).toHaveLength( 1 )
        expect( store.projects.loading() ).toBe( false )
    } )

    it( 'keeps a failed projects fetch in the projects block', () => {
        // Arrange
        findProjects.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchProjectsPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.projects.error()?.summary ).toBe( 'Title' )
    } )

    it( 'reports a 503 on the projects fetch as the global error', () => {
        // Arrange
        findProjects.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchProjectsPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
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

    it( 'notifies when the project options cannot be loaded', () => {
        // Arrange
        getAvailableProjectOptions.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchProjectOptions()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
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
