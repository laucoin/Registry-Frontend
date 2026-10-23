import { Provider, signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Observable, of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { UserProfileStore } from '@core/registry/state/user-profile.store'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'
import { failing } from '@shared/helpers/testing/test-fixtures'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

const USER: CurrentUserModel = { id: 'u1' } as CurrentUserModel
const EMPTY_PAGE: PageModel<UserInvitationModel> = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 1, hasNext: false, lastRefresh: new Date() }
const FAILURE: ErrorModel = { status: 500, title: 'Title', message: 'Message' } as ErrorModel
const UNAVAILABLE: ErrorModel = { status: 503, title: 'Down', message: 'Down' } as ErrorModel

describe( 'UserProfileFacade', () => {
    let facade: UserProfileFacade
    let store: InstanceType<typeof UserProfileStore>
    let currentUser: WritableSignal<CurrentUserModel | undefined>

    let manageAcceptance: Mock<UserProjectProfileApi['manageUserProjectProfileAcceptance']>
    let deleteProfile: Mock<UserProjectProfileApi['deleteUserProfileById']>
    let createSupport: Mock<UserProjectProfileApi['createSupportProjectProfile']>
    let setProjectFavorite: Mock<UserProjectProfileApi['setProjectFavorite']>
    let findProfilesPage: Mock<UserProjectProfileApi['findUserProjectProfiles']>
    let fetchCurrentUser: Mock<() => Observable<void>>
    let notify: Mock<(message: unknown) => void>
    let resetAll: Mock<() => void>

    function mockCollaborators (): void {
        manageAcceptance = vi.fn( () => of( { id: 'pp1', status: { value: 'ACCEPTED' } } as unknown as UserInvitationModel ) )
        deleteProfile = vi.fn( () => of( undefined ) )
        createSupport = vi.fn( () => of( { id: 'p1', name: 'Camp', profile: { id: 'pp2' } } as ProjectModel ) )
        setProjectFavorite = vi.fn( () => of( undefined ) )
        findProfilesPage = vi.fn( () => of( EMPTY_PAGE ) )
        fetchCurrentUser = vi.fn( () => of( undefined ) )
        notify = vi.fn()
        resetAll = vi.fn()
        currentUser = signal<CurrentUserModel | undefined>( USER )
    }

    function provideProfileApi (): Provider {
        return {
            provide: UserProjectProfileApi,
            useValue: {
                manageUserProjectProfileAcceptance: manageAcceptance,
                deleteUserProfileById: deleteProfile,
                createSupportProjectProfile: createSupport,
                setProjectFavorite,
                findUserProjectProfiles: findProfilesPage,
            },
        }
    }

    function provideCollaborators (): Provider[] {
        return [
            { provide: SessionFacade, useValue: { currentUser, fetchCurrentUser } },
            { provide: ErrorReporter, useValue: { notify: vi.fn() } },
            { provide: UiFacade, useValue: { notify } },
            { provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
            { provide: ProfileResetService, useValue: { resetAll } },
        ]
    }

    beforeEach( () => {
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        mockCollaborators()
        TestBed.configureTestingModule( { providers: [ UserProfileFacade, provideProfileApi(), ...provideCollaborators() ] } )
        facade = TestBed.inject( UserProfileFacade )
        store = TestBed.inject( UserProfileStore )
    } )

    describe( 'pages', () => {
        it( 'fetches the requested invitations page', () => {
            // Arrange
            const page: number = 3

            // Act
            facade.fetchProjectProfileInvitationPage( page, 10 )

            // Assert
            expect( findProfilesPage ).toHaveBeenCalledWith( 3, 10, expect.anything() )
        } )

        it( 'restarts from the first page after the invitations search changed', () => {
            // Arrange
            facade.inputInvitationsPageSearchParameters( 'wolves', undefined )

            // Act
            facade.fetchProjectProfileInvitationPage( 4, 10 )

            // Assert
            expect( findProfilesPage ).toHaveBeenCalledWith( 0, 10, expect.anything() )
        } )

        it( 'keeps the invitations search untouched when nothing changed', () => {
            // Arrange
            facade.inputInvitationsPageSearchParameters( 'wolves', undefined )
            facade.fetchProjectProfileInvitationPage( 0, 10 )

            // Act
            facade.inputInvitationsPageSearchParameters( 'wolves', undefined )

            // Assert
            expect( facade.userProjectProfileInvitationsPageResetSearch() ).toBe( false )
            expect( facade.userProjectProfileInvitationsPageQueryParam() ).toBe( 'wolves' )
        } )

        it( 'forgets the loaded invitations once the user is gone', () => {
            // Arrange
            facade.fetchProjectProfileInvitationPage( 0, 10 )
            TestBed.tick()

            // Act
            currentUser.set( undefined )
            TestBed.tick()

            // Assert
            expect( store.invitations.element() ).toBeUndefined()
        } )

        it( 'keeps the loaded invitations while the user is known', () => {
            // Arrange
            facade.fetchProjectProfileInvitationPage( 0, 10 )

            // Act
            TestBed.tick()

            // Assert
            expect( facade.userProjectProfileInvitationsPage() ).toEqual( EMPTY_PAGE )
        } )
    } )

    describe( 'profile commands', () => {
        it( 'notifies and refreshes the user and the invitations page after an invitation answer', () => {
            // Arrange

            // Act
            facade.manageProjectInvitationAcceptance( 'pp1', true )

            // Assert
            expect( manageAcceptance ).toHaveBeenCalledWith( 'pp1', true )
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'project-profiles.notifications.acceptance.ACCEPTED.title' } ) )
            expect( fetchCurrentUser ).toHaveBeenCalledTimes( 1 )
            expect( findProfilesPage ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'notifies the failure of an invitation answer', () => {
            // Arrange
            manageAcceptance.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.manageProjectInvitationAcceptance( 'pp1', false )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
            expect( fetchCurrentUser ).not.toHaveBeenCalled()
        } )

        it( 'toggles the favorite of the project of a profile and shows it in the loaded invitations', () => {
            // Arrange
            const profile: UserInvitationModel = { id: 'pp1', project: { id: 'p1', name: 'Camp', favorite: false } } as UserInvitationModel
            findProfilesPage.mockReturnValue( of( { ...EMPTY_PAGE, content: [ profile ] } ) )
            facade.fetchProjectProfileInvitationPage( 0, 10 )

            // Act
            facade.toggleProjectFavorite( profile )

            // Assert
            expect( setProjectFavorite ).toHaveBeenCalledWith( 'p1', true )
            expect( facade.userProjectProfileInvitationsPage()?.content[ 0 ]?.project?.favorite ).toBe( true )
        } )

        it( 'removes the favorite when the project already is one', () => {
            // Arrange
            const invitation: UserInvitationModel = { id: 'pp1', project: { id: 'p1', name: 'Camp', favorite: true } } as UserInvitationModel

            // Act
            facade.toggleProjectFavorite( invitation )

            // Assert
            expect( setProjectFavorite ).toHaveBeenCalledWith( 'p1', false )
        } )

        it( 'does nothing for a profile without project', () => {
            // Arrange
            const invitation: UserInvitationModel = { id: 'pp1', project: undefined } as UserInvitationModel

            // Act
            facade.toggleProjectFavorite( invitation )

            // Assert
            expect( setProjectFavorite ).not.toHaveBeenCalled()
        } )

        it( 'notifies the failure of a favorite change', () => {
            // Arrange
            setProjectFavorite.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.toggleProjectFavorite( { id: 'pp1', project: { id: 'p1', name: 'Camp', favorite: false } } as UserInvitationModel )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        } )

        it( 'notifies after the deletion of a profile', () => {
            // Arrange
            let completed: boolean = false

            // Act
            facade.deleteUserProjectProfile( { id: 'pp1', project: { name: 'Camp' } } as UserInvitationModel ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( deleteProfile ).toHaveBeenCalledWith( 'pp1' )
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'project-profiles.notifications.delete.title' } ) )
            expect( completed ).toBe( true )
        } )

        it( 'completes without reloading the user when the deletion fails', () => {
            // Arrange
            deleteProfile.mockReturnValue( failing( FAILURE ) )
            let completed: boolean = false

            // Act
            facade.deleteUserProjectProfile( { id: 'pp1', project: { name: 'Camp' } } as UserInvitationModel ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
            expect( fetchCurrentUser ).not.toHaveBeenCalled()
            expect( completed ).toBe( true )
        } )

        it( 'creates a support profile, resets the stores and reloads the user', () => {
            // Arrange
            let completed: boolean = false

            // Act
            facade.createSupportProjectProfile( 'p1' ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( resetAll ).toHaveBeenCalledTimes( 1 )
            expect( createSupport ).toHaveBeenCalledWith( 'p1' )
            expect( fetchCurrentUser ).toHaveBeenCalledTimes( 1 )
            expect( completed ).toBe( true )
        } )

        it( 'toasts a 503 when creating a support profile fails', () => {
            // Arrange
            createSupport.mockReturnValue( failing( UNAVAILABLE ) )

            // Act
            facade.createSupportProjectProfile( 'p1' ).subscribe()

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { sticky: true } ) )
        } )
    } )
} )
