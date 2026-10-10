import { signal, WritableSignal } from '@angular/core'
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
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

const USER: CurrentUserModel = { id: 'u1' } as CurrentUserModel
const EMPTY_PAGE: PageModel<ProjectProfileModel> = { content: [], pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 1, lastRefresh: new Date() }
const FAILURE: ErrorModel = { status: 500, title: 'Title', message: 'Message' } as ErrorModel
const UNAVAILABLE: ErrorModel = { status: 503, title: 'Down', message: 'Down' } as ErrorModel

describe( 'UserProfileFacade', () => {
    let facade: UserProfileFacade
    let store: InstanceType<typeof UserProfileStore>
    let currentUser: WritableSignal<CurrentUserModel | undefined>

    let manageAcceptance: Mock<UserProjectProfileApi['manageUserProjectProfileAcceptance']>
    let deleteProfile: Mock<UserProjectProfileApi['deleteUserProfileById']>
    let createSupport: Mock<UserProjectProfileApi['createSupportProjectProfile']>
    let findProfilesPage: Mock<UserProjectProfileApi['findUserProjectProfiles']>
    let fetchCurrentUser: Mock<() => Observable<void>>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>
    let resetAll: Mock<() => void>

    beforeEach( () => {
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        manageAcceptance = vi.fn( () => of( { id: 'pp1', status: { value: 'ACCEPTED' } } as unknown as ProjectProfileModel ) )
        deleteProfile = vi.fn( () => of( undefined ) )
        createSupport = vi.fn( () => of( { id: 'pp2', project: { name: 'Camp' } } as ProjectProfileModel ) )
        findProfilesPage = vi.fn( () => of( EMPTY_PAGE ) )
        fetchCurrentUser = vi.fn( () => of( undefined ) )
        setGlobalError = vi.fn()
        notify = vi.fn()
        resetAll = vi.fn()
        currentUser = signal<CurrentUserModel | undefined>( USER )

        TestBed.configureTestingModule( {
            providers: [
                UserProfileFacade,
                {
                    provide: UserProjectProfileApi,
                    useValue: {
                        manageUserProjectProfileAcceptance: manageAcceptance,
                        deleteUserProfileById: deleteProfile,
                        createSupportProjectProfile: createSupport,
                        findUserProjectProfiles: findProfilesPage,
                    },
                },
                { provide: SessionFacade, useValue: { currentUser, fetchCurrentUser } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify: vi.fn() } },
                { provide: UiFacade, useValue: { setGlobalError, notify } },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
                { provide: ProfileResetService, useValue: { resetAll } },
            ],
        } )
        facade = TestBed.inject( UserProfileFacade )
        store = TestBed.inject( UserProfileStore )
    } )

    describe( 'pages', () => {
        it( 'fetches the requested profiles page', () => {
            // Arrange
            const pageNumber: number = 3

            // Act
            facade.fetchProjectProfilesPage( pageNumber, 10 )

            // Assert
            expect( findProfilesPage ).toHaveBeenCalledWith( 3, 10, expect.anything() )
        } )

        it( 'restarts from the first page after the profiles search changed', () => {
            // Arrange
            facade.inputProfilesPageSearchParameters( 'wolves', undefined, undefined )

            // Act
            facade.fetchProjectProfilesPage( 4, 10 )

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
            expect( facade.userProjectProfileInvitationsPageTextSearchParam() ).toBe( 'wolves' )
        } )

        it( 'forgets the loaded profiles once the user is gone', () => {
            // Arrange
            facade.fetchProjectProfilesPage( 0, 10 )
            TestBed.tick()

            // Act
            currentUser.set( undefined )
            TestBed.tick()

            // Assert
            expect( store.profiles.element() ).toBeUndefined()
        } )

        it( 'keeps the loaded profiles while the user is known', () => {
            // Arrange
            facade.fetchProjectProfilesPage( 0, 10 )

            // Act
            TestBed.tick()

            // Assert
            expect( facade.userProjectProfilesPage() ).toEqual( EMPTY_PAGE )
        } )
    } )

    describe( 'profile commands', () => {
        it( 'notifies and refreshes the user and both pages after an invitation answer', () => {
            // Arrange

            // Act
            facade.manageProjectInvitationAcceptance( 'pp1', true )

            // Assert
            expect( manageAcceptance ).toHaveBeenCalledWith( 'pp1', true )
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'project-profiles.notifications.acceptance.ACCEPTED.title' } ) )
            expect( fetchCurrentUser ).toHaveBeenCalledTimes( 1 )
            expect( findProfilesPage ).toHaveBeenCalledTimes( 2 )
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

        it( 'notifies and refreshes after the deletion of a profile', () => {
            // Arrange
            let completed: boolean = false

            // Act
            facade.deleteUserProjectProfile( { id: 'pp1', project: { name: 'Camp' } } as ProjectProfileModel ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( deleteProfile ).toHaveBeenCalledWith( 'pp1' )
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'project-profiles.notifications.delete.title' } ) )
            expect( completed ).toBe( true )
        } )

        it( 'completes without refreshing when the deletion fails', () => {
            // Arrange
            deleteProfile.mockReturnValue( failing( FAILURE ) )
            let completed: boolean = false

            // Act
            facade.deleteUserProjectProfile( { id: 'pp1', project: { name: 'Camp' } } as ProjectProfileModel ).subscribe( { complete: (): void => { completed = true } } )

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

        it( 'reports a 503 as the global error when creating a support profile fails', () => {
            // Arrange
            createSupport.mockReturnValue( failing( UNAVAILABLE ) )

            // Act
            facade.createSupportProjectProfile( 'p1' ).subscribe()

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( UNAVAILABLE )
        } )
    } )
} )
