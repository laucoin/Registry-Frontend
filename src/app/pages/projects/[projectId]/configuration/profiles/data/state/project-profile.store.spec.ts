import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserModel } from '@shared/models/model/user.model'

describe( 'ProjectProfileStore', () => {
    let store: InstanceType<typeof ProjectProfileStore>
    let findProjectProfiles: Mock<ProjectProfileApi['findProjectProfiles']>
    let searchUsers: Mock<ProjectProfileApi['searchUsers']>
    let getAssignableProjectProfileRoles: Mock<ProjectProfileApi['getAssignableProjectProfileRoles']>
    let getProfilesStatus: Mock<MetadataApi['getProfilesStatus']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>
    let langChanges: Subject<string>

    beforeEach( () => {
        findProjectProfiles = vi.fn()
        searchUsers = vi.fn()
        getAssignableProjectProfileRoles = vi.fn()
        getProfilesStatus = vi.fn( () => of( [ { label: 'Invited', value: ProfileStatusEnum.INVITED } ] ) )
        setGlobalError = vi.fn()
        notify = vi.fn()
        langChanges = new Subject<string>()
        TestBed.configureTestingModule( {
            providers: [
                ProjectProfileStore,
                { provide: ProjectProfileApi, useValue: { findProjectProfiles, searchUsers, getAssignableProjectProfileRoles } },
                { provide: MetadataApi, useValue: { getProfilesStatus } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify } },
                { provide: TranslocoService, useValue: { langChanges$: langChanges.asObservable() } },
            ],
        } )
        store = TestBed.inject( ProjectProfileStore )
    } )

    it( 'loads the profile statuses on init with an empty option first', () => {
        // Arrange
        const expectedFirst: unknown = { label: '-', value: undefined }

        // Act
        const statuses: unknown[] = store.metadata.status()

        // Assert
        expect( statuses[ 0 ] ).toEqual( expectedFirst )
        expect( statuses ).toHaveLength( 2 )
    } )

    it( 'reloads the statuses when the language changes but not on the initial language', () => {
        // Arrange
        langChanges.next( 'fr' )
        const callsAfterInitial: number = getProfilesStatus.mock.calls.length

        // Act
        langChanges.next( 'en' )

        // Assert
        expect( callsAfterInitial ).toBe( 1 )
        expect( getProfilesStatus ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'stores the fetched profiles page', () => {
        // Arrange
        findProjectProfiles.mockReturnValue( of( pageOf<ProjectProfileModel>( [ { id: 'pp1' } as ProjectProfileModel ] ) ) )

        // Act
        store.fetchProjectProfilesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.projectProfiles.element()?.content ).toHaveLength( 1 )
        expect( store.projectProfiles.loading() ).toBe( false )
    } )

    it( 'keeps a failed profiles fetch in the profiles block', () => {
        // Arrange
        findProjectProfiles.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchProjectProfilesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.projectProfiles.error()?.summary ).toBe( 'Title' )
    } )

    it( 'reports a 503 on the profiles fetch as the global error', () => {
        // Arrange
        findProjectProfiles.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchProjectProfilesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )

    it( 'turns the searched users into select items', () => {
        // Arrange
        searchUsers.mockReturnValue( of( [ { id: 'u1', email: 'a@b.c', firstName: 'Ada', lastName: 'L' } as UserModel ] ) )

        // Act
        store.searchUsers( { projectId: 'p1', textSearched: 'ada' } )

        // Assert
        expect( store.metadata.searched()[ 0 ].label ).toBe( 'a@b.c (Ada L)' )
    } )

    it( 'stores the assignable roles of the project', () => {
        // Arrange
        getAssignableProjectProfileRoles.mockReturnValue( of( [ { label: 'Chief', value: 'CHIEF' } ] ) )

        // Act
        store.fetchAssignableRoles( 'p1' )

        // Assert
        expect( getAssignableProjectProfileRoles ).toHaveBeenCalledWith( 'p1' )
        expect( store.metadata.roles() ).toEqual( [ { label: 'Chief', value: 'CHIEF' } ] )
    } )

    it( 'notifies a failed role fetch and keeps the previous roles', () => {
        // Arrange
        getAssignableProjectProfileRoles.mockReturnValueOnce( of( [ { label: 'Chief', value: 'CHIEF' } ] ) )
        getAssignableProjectProfileRoles.mockReturnValueOnce( failing( ERROR_500 ) )
        store.fetchAssignableRoles( 'p1' )

        // Act
        store.fetchAssignableRoles( 'p1' )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.metadata.roles() ).toHaveLength( 1 )
    } )
} )
