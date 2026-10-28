import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { CreatedProjectProfiles } from '@pages/projects/[projectId]/configuration/profiles/data/dto/created-project-profiles.dto'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

const PROFILE: ProjectProfileModel = { id: 'pp1', user: { firstName: 'Ada', lastName: 'L' } } as ProjectProfileModel

describe( 'ProjectProfileFacade', () => {
    let facade: ProjectProfileFacade
    let findProjectProfiles: Mock<ProjectProfileApi['findProjectProfiles']>
    let createProjectProfiles: Mock<ProjectProfileApi['createProjectProfiles']>
    let blockProjectProfileById: Mock<ProjectProfileApi['blockProjectProfileById']>
    let deleteProjectProfileById: Mock<ProjectProfileApi['deleteProjectProfileById']>
    let notify: Mock<(message: unknown) => void>
    let api: Record<string, Mock>

    beforeEach( () => {
        provideTestConfig()
        findProjectProfiles = vi.fn( () => of( pageOf<ProjectProfileModel>( [], 2 ) ) )
        createProjectProfiles = vi.fn()
        blockProjectProfileById = vi.fn()
        deleteProjectProfileById = vi.fn()
        notify = vi.fn()
        api = { findProjectProfileById: vi.fn(), updateProjectProfileById: vi.fn(), unblockProjectProfileById: vi.fn(), searchUsers: vi.fn( () => of( [] ) ), getAssignableProjectProfileRoles: vi.fn( () => of( [] ) ) }
        TestBed.configureTestingModule( {
            providers: [
                ProjectProfileFacade,
                ProjectProfileStore,
                { provide: ProjectProfileApi, useValue: { findProjectProfiles, createProjectProfiles, blockProjectProfileById, deleteProjectProfileById, ...api } },
                { provide: MetadataApi, useValue: { getProfilesStatus: vi.fn( () => of( [] ) ) } },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: number | unknown[]): string => `${key}:${Array.isArray( count ) ? count.length : count}` } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ), selectedProject: (): unknown => ({ name: 'Camp' }) } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( ProjectProfileFacade )
        facade.fetchProjectProfilesPage( 2, 10 )
        findProjectProfiles.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const page: number = 3

        // Act
        facade.fetchProjectProfilesPage( page, 10 )

        // Assert
        expect( findProjectProfiles ).toHaveBeenCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page when the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'ada', undefined, undefined, undefined )

        // Act
        facade.fetchProjectProfilesPage( 4, 10 )

        // Assert
        expect( findProjectProfiles ).toHaveBeenCalledWith( 'p1', 0, 10, expect.anything() )
    } )

    it( 'reports a full success when every invitation was created', () => {
        // Arrange
        const status: CreatedProjectProfiles = { createdUserIds: [ 'u1', 'u2' ], notCreatedUserIds: [] }
        createProjectProfiles.mockReturnValue( of( status ) )

        // Act
        facade.createProjectProfiles( {} as never ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( {
            severity: SeverityEnum.SUCCESS,
            summary: 'project-profiles.notifications.create.title:2',
            data: { created: 2 },
        } ) )
        expect( findProjectProfiles ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'invites into another project without reloading the profiles of the selected one', () => {
        // Arrange
        createProjectProfiles.mockReturnValue( of( { createdUserIds: [ 'u1' ], notCreatedUserIds: [] } ) )

        // Act
        facade.createProjectProfiles( {} as never, 'p2' ).subscribe()

        // Assert
        expect( createProjectProfiles ).toHaveBeenCalledWith( 'p2', {} )
        expect( findProjectProfiles ).not.toHaveBeenCalled()
    } )

    it( 'warns with the asked and created counts when some invitations failed', () => {
        // Arrange
        const status: CreatedProjectProfiles = { createdUserIds: [ 'u1' ], notCreatedUserIds: [ 'u2', 'u3' ] }
        createProjectProfiles.mockReturnValue( of( status ) )

        // Act
        facade.createProjectProfiles( {} as never ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( {
            severity: SeverityEnum.WARNING,
            data: { asked: 3, created: 1 },
        } ) )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createProjectProfiles.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createProjectProfiles( {} as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
        expect( notify ).not.toHaveBeenCalled()
    } )

    it( 'notifies a block with the identity of the person and reloads the batches already shown', () => {
        // Arrange
        blockProjectProfileById.mockReturnValue( of( PROFILE ) )

        // Act
        facade.blockProjectProfile( PROFILE ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( {
            summary: 'project-profiles.notifications.disable.title',
            data: { firstName: 'Ada', lastName: 'L', name: 'Camp' },
        } ) )
        expect( findProjectProfiles ).toHaveBeenCalledWith( 'p1', 0, 30, expect.anything() )
    } )

    it( 'uses the message meant for another person when deleting a profile', () => {
        // Arrange
        deleteProjectProfileById.mockReturnValue( of( undefined ) )

        // Act
        facade.deleteProjectProfile( PROFILE ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { detail: 'project-profiles.notifications.delete.message.other' } ) )
    } )

    it( 'fetches a project profile of the selected project', () => {
        // Arrange
        api[ 'findProjectProfileById' ].mockReturnValue( of( PROFILE ) )
        let received: ProjectProfileModel | undefined

        // Act
        facade.fetchProjectProfile( 'pp1' ).subscribe( (it: ProjectProfileModel): void => { received = it } )

        // Assert
        expect( api[ 'findProjectProfileById' ] ).toHaveBeenCalledWith( 'p1', 'pp1' )
        expect( received ).toBe( PROFILE )
    } )

    it( 'notifies a failed project profile fetch', () => {
        // Arrange
        api[ 'findProjectProfileById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.fetchProjectProfile( 'pp1' ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
    } )

    it( 'uses the edit notification and refreshes the page after an update', () => {
        // Arrange
        api[ 'updateProjectProfileById' ].mockReturnValue( of( PROFILE ) )

        // Act
        facade.updateProjectProfile( 'pp1', {} as never, 'etag-1' ).subscribe()

        // Assert
        expect( api[ 'updateProjectProfileById' ] ).toHaveBeenCalledWith( 'p1', 'pp1', {}, 'etag-1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'project-profiles.notifications.edit.title', data: expect.objectContaining( { firstName: 'Ada', name: 'Camp' } ) } ) )
        expect( findProjectProfiles ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'notifies and refreshes the page after a profile is unblocked', () => {
        // Arrange
        api[ 'unblockProjectProfileById' ].mockReturnValue( of( PROFILE ) )

        // Act
        facade.unblockProjectProfile( PROFILE ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'project-profiles.notifications.enable.title' } ) )
        expect( findProjectProfiles ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'does not refresh the page when unblocking fails', () => {
        // Arrange
        api[ 'unblockProjectProfileById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.unblockProjectProfile( PROFILE ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( findProjectProfiles ).not.toHaveBeenCalled()
    } )

    it( 'searches the users to invite and the assignable roles for a given project', () => {
        // Arrange
        const query: string = 'ada'

        // Act
        facade.searchUsers( query, 'p2' )
        facade.fetchAssignableRoles( 'p2' )
        facade.searchUsers()
        facade.fetchAssignableRoles()

        // Assert
        expect( api[ 'searchUsers' ] ).toHaveBeenNthCalledWith( 1, 'p2', 'ada' )
        expect( api[ 'searchUsers' ] ).toHaveBeenNthCalledWith( 2, 'p1', undefined )
        expect( api[ 'getAssignableProjectProfileRoles' ] ).toHaveBeenCalledWith( 'p2' )
        expect( api[ 'getAssignableProjectProfileRoles' ] ).toHaveBeenCalledWith( 'p1' )
    } )

    it( 'does not refresh the page after inviting users to another project', () => {
        // Arrange
        createProjectProfiles.mockReturnValue( of( { createdUserIds: [ 'u1' ], notCreatedUserIds: [] } ) )

        // Act
        facade.createProjectProfiles( {} as never, 'p2' ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( findProjectProfiles ).not.toHaveBeenCalled()
    } )

    it( 'exposes the date, status and availability of the search once input', () => {
        // Arrange
        const at: Date = new Date( '2026-01-01T00:00:00.000Z' )

        // Act
        facade.inputPageSearchParameters( 'ada', at, 'ACCEPTED' as never, true )

        // Assert
        expect( facade.projectProfilesPageAtParam()?.toISOString() ).toBe( at.toISOString() )
        expect( facade.projectProfilesPageStatusParam() ).toBe( 'ACCEPTED' )
        expect( facade.projectProfilesPageIsAvailableParam() ).toBe( true )
    } )

    it( 'keeps the search when the same values are input again', () => {
        // Arrange
        facade.inputPageSearchParameters( 'ada', undefined, undefined, undefined )

        // Act
        facade.inputPageSearchParameters( 'ada', undefined, undefined, undefined )

        // Assert
        expect( facade.projectProfilesPageQueryParam() ).toBe( 'ada' )
    } )

    it( 'translates the availability labels except the empty option', () => {
        // Arrange
        const expectedPrefix: string = 't:'

        // Act
        const labels: (string | undefined)[] = facade.projectProfilesAvailabilitiesMetadata().map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels.filter( Boolean ).every( (it: string | undefined): boolean => it === '-' || it!.startsWith( expectedPrefix ) ) ).toBe( true )
    } )
} )
