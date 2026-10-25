import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, MockInstance, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ProjectApi } from '@core/registry/state/project.api'
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
    let setFavoriteById: Mock<ProjectApi['setFavoriteById']>
    let fetchCurrentUser: Mock<SessionFacade['fetchCurrentUser']>
    let notify: Mock<(message: unknown) => void>
    let currentProjectId: WritableSignal<string | undefined>
    let refreshCurrentProject: Mock<SessionFacade['refreshCurrentProject']>
    let api: Record<string, Mock>

    beforeEach( () => {
        provideTestConfig()
        findProjects = vi.fn( () => of( pageOf<ProjectModel>( [], 1 ) ) )
        createProject = vi.fn()
        updateProjectById = vi.fn()
        disableProjectById = vi.fn()
        setFavoriteById = vi.fn( () => of( undefined ) )
        fetchCurrentUser = vi.fn( () => of( undefined ) )
        notify = vi.fn()
        refreshCurrentProject = vi.fn()
        api = { enableProjectById: vi.fn(), deleteProjectById: vi.fn(), getAvailableProjectOptions: vi.fn( () => of( [] ) ) }
        currentProjectId = signal<string | undefined>( undefined )
        TestBed.configureTestingModule( {
            providers: [
                ProjectFacade,
                ProjectStore,
                { provide: ProjectApi, useValue: { findProjects, createProject, updateProjectById, disableProjectById, setFavoriteById, ...api } },
                { provide: SessionFacade, useValue: { currentProjectId, fetchCurrentUser, refreshCurrentProject } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( ProjectFacade )
        facade.fetchProjectsPage( 1, 10 )
        findProjects.mockClear()
    } )

    it( 'fetches the requested projects page', () => {
        // Arrange
        const page: number = 2

        // Act
        facade.fetchProjectsPage( page, 10 )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 2, 10, expect.anything() )
    } )

    it( 'appends the next batch to the projects already shown', () => {
        // Arrange
        findProjects.mockReturnValueOnce( of( pageOf<ProjectModel>( [ { id: 'a' } as ProjectModel ], 0 ) ) )
            .mockReturnValueOnce( of( pageOf<ProjectModel>( [ { id: 'b' } as ProjectModel ], 1 ) ) )
        facade.fetchProjectsPage( 0, 10 )

        // Act
        facade.fetchProjectsPage( 1, 10 )

        // Assert
        expect( facade.projectsPage()?.content.map( (it: ProjectModel): string => it.id ) ).toEqual( [ 'a', 'b' ] )
    } )

    it( 'restarts from the first page when the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'camp', undefined, undefined )

        // Act
        facade.fetchProjectsPage( 3, 10 )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 0, 10, expect.anything() )
    } )

    it( 'keeps the requested page when the search criteria are the same', () => {
        // Arrange
        facade.inputPageSearchParameters( undefined, undefined, undefined )

        // Act
        facade.fetchProjectsPage( 3, 10 )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 3, 10, expect.anything() )
    } )

    it( 'adds a project to the favorites and shows it as a favorite', () => {
        // Arrange
        findProjects.mockReturnValueOnce( of( pageOf<ProjectModel>( [ { id: 'a', favorite: false } as ProjectModel ], 0 ) ) )
        facade.fetchProjectsPage( 0, 10 )

        // Act
        facade.toggleFavorite( { id: 'a', favorite: false } as ProjectModel )

        // Assert
        expect( setFavoriteById ).toHaveBeenCalledWith( 'a', true )
        expect( facade.projectsPage()?.content[ 0 ]?.favorite ).toBe( true )
    } )

    it( 'removes a favorite project from the favorites', () => {
        // Arrange
        const project: ProjectModel = { id: 'a', favorite: true } as ProjectModel

        // Act
        facade.toggleFavorite( project )

        // Assert
        expect( setFavoriteById ).toHaveBeenCalledWith( 'a', false )
    } )

    it( 'notifies and keeps the project unchanged when the favorite command fails', () => {
        // Arrange
        findProjects.mockReturnValueOnce( of( pageOf<ProjectModel>( [ { id: 'a', favorite: false } as ProjectModel ], 0 ) ) )
        facade.fetchProjectsPage( 0, 10 )
        setFavoriteById.mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.toggleFavorite( { id: 'a', favorite: false } as ProjectModel )

        // Assert
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( facade.projectsPage()?.content[ 0 ]?.favorite ).toBe( false )
    } )

    it( 'restarts from the first page when the favorite filter changed', () => {
        // Arrange

        // Act
        facade.inputPageSearchParameters( undefined, undefined, undefined, true )
        facade.fetchProjectsPage( 3, 10 )

        // Assert
        expect( findProjects ).toHaveBeenLastCalledWith( 0, 10, expect.objectContaining( { isFavorite: true } ) )
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

    it( 'reloads every batch shown in one request after a command', () => {
        // Arrange
        disableProjectById.mockReturnValue( of( { id: 'p1', name: 'Camp' } as ProjectModel ) )

        // Act
        facade.disableProject( 'p1' )

        // Assert
        expect( findProjects ).toHaveBeenCalledWith( 0, 20, expect.anything() )
    } )

    it( 'exposes the failure of the project fetch', () => {
        // Arrange
        Object.assign( TestBed.inject( ProjectApi ), { findProjectById: vi.fn( () => failing( ERROR_500 ) ) } )

        // Act
        facade.fetchProject( 'p1' )

        // Assert
        expect( facade.projectError()?.summary ).toBe( 'Title' )
    } )

    it( 'reloads the current project after enabling it', () => {
        // Arrange
        currentProjectId.set( 'p1' )
        api[ 'enableProjectById' ].mockReturnValue( of( { id: 'p1', name: 'Camp' } as ProjectModel ) )

        // Act
        facade.enableProject( 'p1' )

        // Assert
        expect( refreshCurrentProject ).toHaveBeenCalledTimes( 1 )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'projects.notifications.enable.title' } ) )
    } )

    it( 'does not reload another project after enabling it', () => {
        // Arrange
        currentProjectId.set( 'other' )
        api[ 'enableProjectById' ].mockReturnValue( of( { id: 'p1', name: 'Camp' } as ProjectModel ) )

        // Act
        facade.enableProject( 'p1' )

        // Assert
        expect( refreshCurrentProject ).not.toHaveBeenCalled()
    } )

    it.each( [ 'disable', 'delete' ] as const )( 'leaves the current project for the projects list after the project is %sd', (command: 'disable' | 'delete') => {
        // Arrange
        const navigateByUrl: MockInstance = vi.spyOn( TestBed.inject( Router ), 'navigateByUrl' ).mockResolvedValue( true )
        currentProjectId.set( 'p1' )
        const project: ProjectModel = { id: 'p1', name: 'Camp' } as ProjectModel
        disableProjectById.mockReturnValue( of( project ) )
        api[ 'deleteProjectById' ].mockReturnValue( of( undefined ) )

        // Act
        if (command === 'disable') facade.disableProject( 'p1' )
        else facade.deleteProject( project )

        // Assert
        expect( navigateByUrl ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'swallows a refused navigation after a deletion', async () => {
        // Arrange
        vi.spyOn( TestBed.inject( Router ), 'navigateByUrl' ).mockRejectedValue( new Error( 'refused' ) )
        currentProjectId.set( 'p1' )
        api[ 'deleteProjectById' ].mockReturnValue( of( undefined ) )

        // Act
        facade.deleteProject( { id: 'p1', name: 'Camp' } as ProjectModel )
        await Promise.resolve()

        // Assert
        expect( notify ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'does not reload the page when a deletion fails', () => {
        // Arrange
        api[ 'deleteProjectById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.deleteProject( { id: 'p1' } as ProjectModel )

        // Assert
        expect( findProjects ).not.toHaveBeenCalled()
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
    } )

    it( 'loads the project options and refreshes the shown batches in one request', () => {
        // Arrange
        facade.fetchProjectsPage( 0, 10 )
        findProjects.mockClear()

        // Act
        facade.fetchProjectOptions()
        facade.refreshProjectsPage()

        // Assert
        expect( api[ 'getAvailableProjectOptions' ] ).toHaveBeenCalledTimes( 1 )
        expect( findProjects ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'forgets the project and the created project id on reset', () => {
        // Arrange
        Object.assign( TestBed.inject( ProjectApi ), { findProjectById: vi.fn( () => of( { id: 'p1' } as ProjectModel ) ) } )
        facade.fetchProject( 'p1' )

        // Act
        facade.resetProject()

        // Assert
        expect( facade.project() ).toBeUndefined()
    } )

    it( 'translates the labels of the profile and favorite filters except the empty option', () => {
        // Arrange
        const expectedPrefix: string = 't:'

        // Act
        const labels: (string | undefined)[] = [ ...facade.withProfilesMetadata(), ...facade.favoritesMetadata() ].map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels.every( (it: string | undefined): boolean => it === '-' || it!.startsWith( expectedPrefix ) ) ).toBe( true )
    } )
} )
