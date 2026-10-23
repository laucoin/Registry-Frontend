import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectStore } from '@pages/projects/data/state/project/project.store'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { ProjectModel } from '@shared/models/model/project.model'

describe( 'ProjectFacade', () => {
    let facade: ProjectFacade
    let findProjects: Mock<ProjectApi['findProjects']>
    let createProject: Mock<ProjectApi['createProject']>
    let updateProjectById: Mock<ProjectApi['updateProjectById']>
    let disableProjectById: Mock<ProjectApi['disableProjectById']>
    let fetchCurrentUser: Mock<RegistryFacade['fetchCurrentUser']>
    let notify: Mock<(message: unknown) => void>
    let currentProjectId: WritableSignal<string | undefined>

    beforeEach( () => {
        provideTestConfig()
        findProjects = vi.fn( () => of( pageOf<ProjectModel>( [], 1 ) ) )
        createProject = vi.fn()
        updateProjectById = vi.fn()
        disableProjectById = vi.fn()
        fetchCurrentUser = vi.fn( () => of( undefined ) )
        notify = vi.fn()
        currentProjectId = signal<string | undefined>( undefined )
        TestBed.configureTestingModule( {
            providers: [
                ProjectFacade,
                ProjectStore,
                { provide: ProjectApi, useValue: { findProjects, createProject, updateProjectById, disableProjectById } },
                { provide: RegistryFacade, useValue: { fetchCurrentUser } },
                { provide: SessionFacade, useValue: { currentProjectId } },
                { provide: UiFacade, useValue: { notify, setGlobalError: vi.fn() } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( ProjectFacade )
        facade.fetchProjectsPage( 1, 10 )
        findProjects.mockClear()
    } )

    it( 'fetches the requested projects page', () => {
        // Arrange
        const pageNumber: number = 2

        // Act
        facade.fetchProjectsPage( pageNumber, 10 )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 2, 10, expect.anything() )
    } )

    it( 'restarts from the first page when the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'camp', undefined, true, undefined )

        // Act
        facade.fetchProjectsPage( 3, 10 )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 0, 10, expect.anything() )
    } )

    it( 'keeps the requested page when the search criteria are the same', () => {
        // Arrange
        facade.inputPageSearchParameters( undefined, undefined, true, undefined )

        // Act
        facade.fetchProjectsPage( 3, 10 )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 3, 10, expect.anything() )
    } )

    it( 'translates the visibility labels except the empty option', () => {
        // Arrange
        const expected: (string | undefined)[] = [ '-', 't:projects.visible.true', 't:projects.visible.false' ]

        // Act
        const labels: (string | undefined)[] = facade.visibilitiesMetadata().map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels ).toEqual( expected )
    } )

    it( 'remembers the created project, notifies and reloads the current user', () => {
        // Arrange
        createProject.mockReturnValue( of( { id: 'p1', name: 'Camp' } as ProjectModel ) )

        // Act
        facade.createProject( {} as never ).subscribe()

        // Assert
        expect( facade.createdProjectId() ).toBe( 'p1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'projects.notifications.create.title' } ) )
        expect( fetchCurrentUser ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'does not reload the user when the creation fails', () => {
        // Arrange
        createProject.mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.createProject( {} as never ).subscribe()

        // Assert
        expect( fetchCurrentUser ).not.toHaveBeenCalled()
        expect( facade.createdProjectId() ).toBeUndefined()
        expect( facade.projectLoading() ).toBe( false )
    } )

    it( 'reloads the user after an update only for the selected project', () => {
        // Arrange
        updateProjectById.mockReturnValue( of( { id: 'p1', name: 'Camp' } as ProjectModel ) )
        currentProjectId.set( 'other' )
        facade.updateProject( 'p1', {} as never ).subscribe()
        const reloadedForOther: number = fetchCurrentUser.mock.calls.length

        // Act
        currentProjectId.set( 'p1' )
        facade.updateProject( 'p1', {} as never ).subscribe()

        // Assert
        expect( reloadedForOther ).toBe( 0 )
        expect( fetchCurrentUser ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'reloads the user and the page after disabling a project', () => {
        // Arrange
        disableProjectById.mockReturnValue( of( { id: 'p1', name: 'Camp' } as ProjectModel ) )

        // Act
        facade.disableProject( 'p1' )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'projects.notifications.disable.title' } ) )
        expect( fetchCurrentUser ).toHaveBeenCalledTimes( 1 )
        expect( findProjects ).toHaveBeenCalledTimes( 1 )
    } )
} )
