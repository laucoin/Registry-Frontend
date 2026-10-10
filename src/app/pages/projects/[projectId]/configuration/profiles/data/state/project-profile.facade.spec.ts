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

const PROFILE: ProjectProfileModel = { id: 'pp1', user: { firstName: 'Ada', lastName: 'L' }, project: { name: 'Camp' } } as ProjectProfileModel

describe( 'ProjectProfileFacade', () => {
    let facade: ProjectProfileFacade
    let findProjectProfiles: Mock<ProjectProfileApi['findProjectProfiles']>
    let createProjectProfiles: Mock<ProjectProfileApi['createProjectProfiles']>
    let blockProjectProfileById: Mock<ProjectProfileApi['blockProjectProfileById']>
    let deleteProjectProfileById: Mock<ProjectProfileApi['deleteProjectProfileById']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findProjectProfiles = vi.fn( () => of( pageOf<ProjectProfileModel>( [], 2 ) ) )
        createProjectProfiles = vi.fn()
        blockProjectProfileById = vi.fn()
        deleteProjectProfileById = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ProjectProfileFacade,
                ProjectProfileStore,
                { provide: ProjectProfileApi, useValue: { findProjectProfiles, createProjectProfiles, blockProjectProfileById, deleteProjectProfileById } },
                { provide: MetadataApi, useValue: { getProfilesStatus: vi.fn( () => of( [] ) ) } },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: number | unknown[]): string => `${key}:${Array.isArray( count ) ? count.length : count}` } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify, setGlobalError: vi.fn() } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( ProjectProfileFacade )
        facade.fetchProjectProfilesPage( 2, 10 )
        findProjectProfiles.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchProjectProfilesPage( pageNumber, 10 )

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

    it( 'notifies a block with the identity of the person and refreshes the page', () => {
        // Arrange
        blockProjectProfileById.mockReturnValue( of( PROFILE ) )

        // Act
        facade.blockProjectProfile( PROFILE ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( {
            summary: 'project-profiles.notifications.disable.title',
            data: { firstName: 'Ada', lastName: 'L', name: 'Camp' },
        } ) )
        expect( findProjectProfiles ).toHaveBeenCalledWith( 'p1', 2, 10, expect.anything() )
    } )

    it( 'uses the message meant for another person when deleting a profile', () => {
        // Arrange
        deleteProjectProfileById.mockReturnValue( of( undefined ) )

        // Act
        facade.deleteProjectProfile( PROFILE ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { detail: 'project-profiles.notifications.delete.message.other' } ) )
    } )
} )
