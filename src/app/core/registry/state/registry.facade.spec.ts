import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { PrimeNG } from 'primeng/config'
import { Observable, of, Subject, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { BrowserService } from '@core/browser/browser.service'
import { SecurityApi } from '@core/authentication/service/security.api'
import { PreferencesApi } from '@core/registry/state/preferences.api'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { SessionStore } from '@core/registry/state/session.store'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { UserApi } from '@pages/users/data/state/user.api'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserModel } from '@shared/models/model/user.model'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { REDIRECT_URI } from '@shared/helpers/request.helper'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'

const USER: CurrentUserModel = { id: 'u1', preferences: { userId: 'u1', theme: 'LIGHT', language: 'fr' } } as CurrentUserModel
const EMPTY_PAGE: PageModel<ProjectProfileModel> = { content: [], pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 1, lastRefresh: new Date() }
const FAILURE: ErrorModel = { status: 500, title: 'Title', message: 'Message' } as ErrorModel
const UNAVAILABLE: ErrorModel = { status: 503, title: 'Down', message: 'Down' } as ErrorModel

function failing<T = never> (error: ErrorModel): Observable<T> {
    return throwError( (): ErrorModel => error )
}

describe( 'RegistryFacade', () => {
    let facade: RegistryFacade
    let session: InstanceType<typeof SessionStore>
    let sessionFacade: SessionFacade
    let theme: WritableSignal<ThemeEnum>

    let getLoginUri: Mock<SecurityApi['getLoginUri']>
    let getLogoutUri: Mock<SecurityApi['getLogoutUri']>
    let fetchToken: Mock<SecurityApi['fetchToken']>
    let fetchCurrentUser: Mock<SecurityApi['fetchCurrentUser']>
    let impersonateCurrentUser: Mock<UserApi['impersonateCurrentUser']>
    let updateThemePreference: Mock<PreferencesApi['updateTheme']>
    let updateLanguagePreference: Mock<PreferencesApi['updateLanguage']>
    let findByProjectId: Mock<UserProjectProfileApi['findUserProjectProfileByProjectId']>
    let manageAcceptance: Mock<UserProjectProfileApi['manageUserProjectProfileAcceptance']>
    let deleteProfile: Mock<UserProjectProfileApi['deleteUserProfileById']>
    let createSupport: Mock<UserProjectProfileApi['createSupportProjectProfile']>
    let findProfilesPage: Mock<UserProjectProfileApi['findUserProjectProfiles']>

    let navigateByUrl: Mock<Router['navigateByUrl']>
    let loadLanguage: Mock<TranslocoService['load']>
    let setActiveLang: Mock<TranslocoService['setActiveLang']>
    let startGlobalLoader: Mock<() => void>
    let stopGlobalLoader: Mock<() => void>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let updateTheme: Mock<(theme: ThemeEnum) => void>
    let notify: Mock<(message: unknown) => void>
    let resetAll: Mock<() => void>
    let updateLanguage: Mock<(language: string) => void>
    let redirect: Mock<(url: string) => void>

    beforeEach( () => {
        sessionStorage.clear()
        RegistryConfig.config = { defaultLanguage: 'fr', languages: [ 'fr', 'en' ], notification: { duration: {} } } as unknown as ConfigModel

        getLoginUri = vi.fn( () => of( { uri: '#login' } ) )
        getLogoutUri = vi.fn( () => of( { uri: '#logout' } ) )
        fetchToken = vi.fn( () => of( undefined ) )
        fetchCurrentUser = vi.fn( () => of( USER ) )
        impersonateCurrentUser = vi.fn( () => of( { id: 'u2' } as UserModel ) )
        updateThemePreference = vi.fn( () => of( { userId: 'u1', theme: 'DARK', language: 'fr' } ) )
        updateLanguagePreference = vi.fn( () => of( { userId: 'u1', theme: 'LIGHT', language: 'en' } ) )
        findByProjectId = vi.fn( () => of( { id: 'pp1' } as ProjectProfileModel ) )
        manageAcceptance = vi.fn( () => of( { id: 'pp1', status: { value: 'ACCEPTED' } } as unknown as ProjectProfileModel ) )
        deleteProfile = vi.fn( () => of( undefined ) )
        createSupport = vi.fn( () => of( { id: 'pp2', project: { name: 'Camp' } } as ProjectProfileModel ) )
        findProfilesPage = vi.fn()

        navigateByUrl = vi.fn( () => Promise.resolve( true ) )
        loadLanguage = vi.fn( () => of( {} ) )
        setActiveLang = vi.fn()
        startGlobalLoader = vi.fn()
        stopGlobalLoader = vi.fn()
        setGlobalError = vi.fn()
        updateTheme = vi.fn()
        notify = vi.fn()
        resetAll = vi.fn()
        updateLanguage = vi.fn()
        redirect = vi.fn()
        theme = signal( ThemeEnum.LIGHT )

        TestBed.configureTestingModule( {
            providers: [
                RegistryFacade,
                { provide: SecurityApi, useValue: { getLoginUri, getLogoutUri, fetchToken, fetchCurrentUser } },
                { provide: UserApi, useValue: { impersonateCurrentUser } },
                { provide: PreferencesApi, useValue: { updateTheme: updateThemePreference, updateLanguage: updateLanguagePreference } },
                {
                    provide: UserProjectProfileApi,
                    useValue: {
                        findUserProjectProfileByProjectId: findByProjectId,
                        manageUserProjectProfileAcceptance: manageAcceptance,
                        deleteUserProfileById: deleteProfile,
                        createSupportProjectProfile: createSupport,
                        findUserProjectProfiles: findProfilesPage,
                    },
                },
                { provide: ErrorReporter, useValue: { setGlobalError, notify: vi.fn() } },
                { provide: UiFacade, useValue: { theme, startGlobalLoader, stopGlobalLoader, setGlobalError, updateTheme, updateLanguage, notify } },
                { provide: BrowserService, useValue: { pathname: '/current', origin: 'http://app.test', redirect } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: PrimeNG, useValue: { setTranslation: vi.fn() } },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
                { provide: TranslocoService, useValue: {
                    translate: (key: string): string => key,
                    translateObject: (): object => ({}),
                    getActiveLang: (): string => 'fr',
                    load: loadLanguage,
                    setActiveLang,
                } },
                { provide: ProfileResetService, useValue: { resetAll } },
            ],
        } )
        facade = TestBed.inject( RegistryFacade )
        session = TestBed.inject( SessionStore )
        sessionFacade = TestBed.inject( SessionFacade )
    } )

    describe( 'login', () => {
        it( 'remembers the current path, clears the session and redirects to the identity provider', () => {
            // Arrange
            session.setCurrentUser( USER )

            // Act
            facade.login()

            // Assert
            expect( sessionStorage.getItem( REDIRECT_URI ) ).toBe( '/current' )
            expect( session.currentUser() ).toBeUndefined()
            expect( redirect ).toHaveBeenCalledWith( '#login' )
            expect( startGlobalLoader ).toHaveBeenCalledTimes( 1 )
            expect( stopGlobalLoader ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'shows the global error and stays put when the login uri cannot be fetched', () => {
            // Arrange
            getLoginUri.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.login()

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( FAILURE )
            expect( redirect ).not.toHaveBeenCalled()
            expect( stopGlobalLoader ).toHaveBeenCalledTimes( 1 )
        } )
    } )

    describe( 'logout', () => {
        it( 'redirects to the logout uri', () => {
            // Arrange
            const expectedUrl: string = '#logout'

            // Act
            facade.logout()

            // Assert
            expect( redirect ).toHaveBeenCalledWith( expectedUrl )
        } )

        it( 'shows the global error when the logout uri cannot be fetched', () => {
            // Arrange
            getLogoutUri.mockReturnValue( failing( UNAVAILABLE ) )

            // Act
            facade.logout()

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( UNAVAILABLE )
        } )
    } )

    describe( 'fetchToken', () => {
        it( 'loads the user then goes back to the remembered page', () => {
            // Arrange
            sessionStorage.setItem( REDIRECT_URI, '/projects/42' )

            // Act
            facade.fetchToken( 'code' )

            // Assert
            expect( fetchToken ).toHaveBeenCalledWith( expect.objectContaining( { authorizationCode: 'code' } ) )
            expect( session.currentUser() ).toEqual( USER )
            expect( navigateByUrl ).toHaveBeenCalledWith( '/projects/42' )
        } )

        it( 'falls back to the projects page instead of looping on the callback route', () => {
            // Arrange
            sessionStorage.setItem( REDIRECT_URI, '/auth/callback' )

            // Act
            facade.fetchToken( 'code' )

            // Assert
            expect( navigateByUrl ).toHaveBeenCalledWith( 'projects' )
        } )

        it( 'shows the global error when the token exchange fails', () => {
            // Arrange
            fetchToken.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.fetchToken( 'code' )

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( FAILURE )
            expect( navigateByUrl ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'fetchCurrentUser', () => {
        it( 'stores the user and completes', () => {
            // Arrange
            let completed: boolean = false

            // Act
            facade.fetchCurrentUser().subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( session.currentUser() ).toEqual( USER )
            expect( completed ).toBe( true )
        } )

        it( 'applies the theme of the user when it differs from the current one', () => {
            // Arrange
            fetchCurrentUser.mockReturnValue( of( { ...USER, preferences: { ...USER.preferences, theme: 'DARK' } } ) )

            // Act
            facade.fetchCurrentUser()

            // Assert
            expect( updateTheme ).toHaveBeenCalledWith( ThemeEnum.DARK )
        } )

        it( 'switches the language when the user prefers another one', () => {
            // Arrange
            fetchCurrentUser.mockReturnValue( of( { ...USER, preferences: { ...USER.preferences, language: 'en' } } ) )

            // Act
            facade.fetchCurrentUser()

            // Assert
            expect( loadLanguage ).toHaveBeenCalledWith( 'en' )
            expect( setActiveLang ).toHaveBeenCalledWith( 'en' )
        } )

        it( 'shows the global error yet still completes when the fetch fails', () => {
            // Arrange
            fetchCurrentUser.mockReturnValue( failing( FAILURE ) )
            let completed: boolean = false

            // Act
            facade.fetchCurrentUser().subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( FAILURE )
            expect( completed ).toBe( true )
        } )
    } )

    describe( 'impersonateCurrentUser', () => {
        it( 'signs out once the impersonation succeeded', () => {
            // Arrange
            const expectedUrl: string = '#logout'

            // Act
            facade.impersonateCurrentUser()

            // Assert
            expect( redirect ).toHaveBeenCalledWith( expectedUrl )
        } )

        it( 'notifies the failure and ends the action loader', () => {
            // Arrange
            impersonateCurrentUser.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.impersonateCurrentUser()

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
            expect( redirect ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'preferences', () => {
        it( 'ignores an undefined theme', () => {
            // Arrange
            const theme: ThemeEnum | undefined = undefined

            // Act
            facade.updateCurrentUserTheme( theme )

            // Assert
            expect( updateThemePreference ).not.toHaveBeenCalled()
            expect( updateTheme ).not.toHaveBeenCalled()
        } )

        it( 'applies the theme immediately and saves it on the user', () => {
            // Arrange
            session.setCurrentUser( USER )

            // Act
            facade.updateCurrentUserTheme( ThemeEnum.DARK )

            // Assert
            expect( updateTheme ).toHaveBeenCalledWith( ThemeEnum.DARK )
            expect( updateThemePreference ).toHaveBeenCalledWith( 'DARK' )
            expect( facade.currentUserTheme() ).toBe( ThemeEnum.DARK )
        } )

        it( 'falls back to the UI theme when the user has no stored theme', () => {
            // Arrange
            theme.set( ThemeEnum.DARK )

            // Act
            const current: ThemeEnum | undefined = facade.currentUserTheme()

            // Assert
            expect( current ).toBe( ThemeEnum.DARK )
        } )

        it( 'notifies when saving the theme fails', () => {
            // Arrange
            updateThemePreference.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.updateCurrentUserTheme( ThemeEnum.DARK )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        } )

        it( 'switches the language and saves it', () => {
            // Arrange
            const language: string = 'en'

            // Act
            facade.updateCurrentUserLanguage( language )

            // Assert
            expect( setActiveLang ).toHaveBeenCalledWith( 'en' )
            expect( updateLanguage ).toHaveBeenCalledWith( 'en' )
            expect( updateLanguagePreference ).toHaveBeenCalledWith( 'en' )
            expect( fetchCurrentUser ).toHaveBeenCalledTimes( 1 )
        } )
    } )

    describe( 'setCurrentProject', () => {
        it( 'clears the project and completes at once when no id is given', () => {
            // Arrange
            session.setCurrentProject( 'p1', { id: 'pp1' } as ProjectProfileModel )
            let completed: boolean = false

            // Act
            facade.setCurrentProject( undefined ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( sessionFacade.currentProjectId() ).toBeUndefined()
            expect( resetAll ).toHaveBeenCalledTimes( 1 )
            expect( completed ).toBe( true )
        } )

        it( 'loads the profile of the project and stores it', () => {
            // Arrange
            let completed: boolean = false

            // Act
            facade.setCurrentProject( 'p1' ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( findByProjectId ).toHaveBeenCalledWith( 'p1' )
            expect( sessionFacade.currentProjectId() ).toBe( 'p1' )
            expect( completed ).toBe( true )
        } )

        it( 'releases the caller of a superseded call without keeping its result', () => {
            // Arrange
            const slow: Subject<ProjectProfileModel> = new Subject<ProjectProfileModel>()
            findByProjectId.mockReturnValueOnce( slow )
            let firstCompleted: boolean = false
            facade.setCurrentProject( 'p1' ).subscribe( { complete: (): void => { firstCompleted = true } } )

            // Act
            facade.setCurrentProject( 'p2' ).subscribe()
            slow.next( { id: 'late' } as ProjectProfileModel )

            // Assert
            expect( firstCompleted ).toBe( true )
            expect( sessionFacade.currentProjectId() ).toBe( 'p2' )
        } )

        it( 'shows the global error and completes when the profile cannot be loaded', () => {
            // Arrange
            findByProjectId.mockReturnValue( failing( FAILURE ) )
            let completed: boolean = false

            // Act
            facade.setCurrentProject( 'p1' ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( FAILURE )
            expect( completed ).toBe( true )
        } )
    } )

    describe( 'profile commands', () => {
        it( 'notifies and refreshes the user and both pages after an invitation answer', () => {
            // Arrange
            findProfilesPage.mockReturnValue( of( EMPTY_PAGE ) )

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
            findProfilesPage.mockReturnValue( of( EMPTY_PAGE ) )
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
