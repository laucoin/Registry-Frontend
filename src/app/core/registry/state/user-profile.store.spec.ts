import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserProfileStore } from '@core/registry/state/user-profile.store'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageModel } from '@shared/models/model/page.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

const PAGE: PageModel<UserInvitationModel> = {
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    hasNext: false,
    content: [ { id: 'pp1' } as UserInvitationModel ],
    lastRefresh: new Date(),
}

describe( 'UserProfileStore', () => {
    let store: InstanceType<typeof UserProfileStore>
    let findUserProjectProfiles: Mock<UserProjectProfileApi['findUserProjectProfiles']>

    beforeEach( () => {
        findUserProjectProfiles = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                { provide: UserProjectProfileApi, useValue: { findUserProjectProfiles } },
                { provide: ErrorReporter, useValue: { notify: vi.fn() } },
            ],
        } )
        store = TestBed.inject( UserProfileStore )
    } )

    it( 'stores the fetched profiles page and the invitations page separately', () => {
        // Arrange
        findUserProjectProfiles.mockReturnValue( of( PAGE ) )

        // Act
        store.fetchProfilesPage( { page: 0, size: 10 } )

        // Assert
        expect( store.profiles.element() ).toEqual( PAGE )
        expect( store.invitations.element() ).toBeUndefined()
        expect( store.profiles.loading() ).toBe( false )
    } )

    it( 'appends the next batch to the profiles and to the invitations already shown', () => {
        // Arrange
        const first: PageModel<UserInvitationModel> = { ...PAGE, size: 1, totalPages: 2 }
        const second: PageModel<UserInvitationModel> = { ...first, page: 1, content: [ { id: 'pp2' } as UserInvitationModel ] }
        findUserProjectProfiles.mockReturnValueOnce( of( first ) ).mockReturnValueOnce( of( first ) )
            .mockReturnValueOnce( of( second ) ).mockReturnValueOnce( of( second ) )
        store.fetchProfilesPage( { page: 0, size: 1 } )
        store.fetchInvitationsPage( { page: 0, size: 1 } )

        // Act
        store.fetchProfilesPage( { page: 1, size: 1 } )
        store.fetchInvitationsPage( { page: 1, size: 1 } )

        // Assert
        const ids: string[][] = [ store.profiles.element(), store.invitations.element() ].map( (shown: PageModel<UserInvitationModel> | undefined): string[] => shown!.content.map( (profile: UserInvitationModel): string => profile.id ) )
        expect( ids ).toEqual( [ [ 'pp1', 'pp2' ], [ 'pp1', 'pp2' ] ] )
    } )

    it( 'keeps the error of a failed invitations fetch in the invitations block', () => {
        // Arrange
        findUserProjectProfiles.mockReturnValue( throwError( (): ErrorModel => ({ status: 500, title: 'Title', message: 'Message' }) as ErrorModel ) )

        // Act
        store.fetchInvitationsPage( { page: 0, size: 10 } )

        // Assert
        expect( store.invitations.error()?.summary ).toBe( 'Title' )
        expect( store.profiles.error() ).toBeUndefined()
    } )

    it( 'keeps a 503 failure in its block', () => {
        // Arrange
        const error: ErrorModel = { status: 503 } as ErrorModel
        findUserProjectProfiles.mockReturnValue( throwError( (): ErrorModel => error ) )

        // Act
        store.fetchProfilesPage( { page: 0, size: 10 } )

        // Assert
        expect( store.profiles.error() ).toBeDefined()
    } )

    it( 'merges the search parameters of the profiles page', () => {
        // Arrange
        const params: { q: string, resetSearch: boolean } = { q: 'wolves', resetSearch: true }

        // Act
        store.updateProfilesPageSearchParams( params )

        // Assert
        expect( store.profiles.params.q() ).toBe( 'wolves' )
        expect( store.profiles.params.status() ).toBeDefined()
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
        store.fetchProfilesPage( { page: 0, size: 10 } )

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
