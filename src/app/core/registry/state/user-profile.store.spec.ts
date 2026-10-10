import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserProfileStore } from '@core/registry/state/user-profile.store'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

const PAGE: PageModel<ProjectProfileModel> = {
    pageNumber: 0,
    pageSize: 10,
    totalElements: 1,
    totalPages: 1,
    content: [ { id: 'pp1' } as ProjectProfileModel ],
    lastRefresh: new Date(),
}

describe( 'UserProfileStore', () => {
    let store: InstanceType<typeof UserProfileStore>
    let findUserProjectProfiles: Mock<UserProjectProfileApi['findUserProjectProfiles']>
    let setGlobalError: Mock<(error: ErrorModel) => void>

    beforeEach( () => {
        findUserProjectProfiles = vi.fn()
        setGlobalError = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                { provide: UserProjectProfileApi, useValue: { findUserProjectProfiles } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify: vi.fn() } },
            ],
        } )
        store = TestBed.inject( UserProfileStore )
    } )

    it( 'stores the fetched profiles page and the invitations page separately', () => {
        // Arrange
        findUserProjectProfiles.mockReturnValue( of( PAGE ) )

        // Act
        store.fetchProfilesPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.profiles.element() ).toEqual( PAGE )
        expect( store.invitations.element() ).toBeUndefined()
        expect( store.profiles.loading() ).toBe( false )
    } )

    it( 'keeps the error of a failed invitations fetch in the invitations block', () => {
        // Arrange
        findUserProjectProfiles.mockReturnValue( throwError( (): ErrorModel => ({ status: 500, title: 'Title', message: 'Message' }) as ErrorModel ) )

        // Act
        store.fetchInvitationsPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.invitations.error()?.summary ).toBe( 'Title' )
        expect( store.profiles.error() ).toBeUndefined()
    } )

    it( 'reports a 503 as the global error', () => {
        // Arrange
        const error: ErrorModel = { status: 503 } as ErrorModel
        findUserProjectProfiles.mockReturnValue( throwError( (): ErrorModel => error ) )

        // Act
        store.fetchProfilesPage( { pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( error )
        expect( store.profiles.error() ).toBeUndefined()
    } )

    it( 'merges the search parameters of the profiles page', () => {
        // Arrange
        const params: { textSearched: string, resetSearch: boolean } = { textSearched: 'wolves', resetSearch: true }

        // Act
        store.updateProfilesPageSearchParams( params )

        // Assert
        expect( store.profiles.params.textSearched() ).toBe( 'wolves' )
        expect( store.profiles.params.statusSearched() ).toBeDefined()
    } )

    it( 'toggles the profile loader', () => {
        // Arrange
        store.startProfileLoader()
        const loadingWhileRunning: boolean = store.profile.loading()

        // Act
        store.stopProfileLoader()

        // Assert
        expect( loadingWhileRunning ).toBe( true )
        expect( store.profile.loading() ).toBe( false )
    } )

    it( 'forgets the loaded profiles on reset', () => {
        // Arrange
        findUserProjectProfiles.mockReturnValue( of( PAGE ) )
        store.fetchProfilesPage( { pageNumber: 0, pageSize: 10 } )

        // Act
        store.reset()

        // Assert
        expect( store.profiles.element() ).toBeUndefined()
    } )

    it( 'raises and lowers the profile loader', () => {
        // Arrange
        store.startProfileLoader()
        const whileRunning: boolean = store.profile.loading()

        // Act
        store.stopProfileLoader()

        // Assert
        expect( whileRunning ).toBe( true )
        expect( store.profile.loading() ).toBe( false )
    } )
} )
