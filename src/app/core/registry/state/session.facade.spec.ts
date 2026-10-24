import { Provider, signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { Observable, of, Subject, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { BrowserService } from '@core/browser/browser.service'
import { LanguageService } from '@core/language/language.service'
import { SecurityApi } from '@core/authentication/service/security.api'
import { PreferencesApi } from '@core/registry/state/preferences.api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { SessionStore } from '@core/registry/state/session.store'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ProjectApi } from '@core/registry/state/project.api'
import { UserApi } from '@core/registry/state/user.api'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ThemeChoiceModel } from '@shared/models/model/theme-choice.model'
import { REDIRECT_URI } from '@shared/helpers/request.helper'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'

const USER: CurrentUserModel = { id: 'u1', preferences: { userId: 'u1', theme: 'LIGHT', language: 'fr', refreshMode: 'NORMAL' } } as CurrentUserModel
const FAILURE: ErrorModel = { status: 500, title: 'Title', message: 'Message' } as ErrorModel
const UNAVAILABLE: ErrorModel = { status: 503, title: 'Down', message: 'Down' } as ErrorModel

function failing<T = never> (error: ErrorModel): Observable<T> {
    return throwError( (): ErrorModel => error )
}

describe( 'SessionFacade', () => {
    let facade: SessionFacade
    let session: InstanceType<typeof SessionStore>
    let theme: WritableSignal<ThemeEnum>

    let getLoginUri: Mock<SecurityApi['getLoginUri']>
    let getLogoutUri: Mock<SecurityApi['getLogoutUri']>
    let fetchToken: Mock<SecurityApi['fetchToken']>
    let fetchCurrentUser: Mock<SecurityApi['fetchCurrentUser']>
    let refreshToken: Mock<SecurityApi['refreshToken']>
    let updateThemePreference: Mock<PreferencesApi['updateTheme']>
    let updateLanguagePreference: Mock<PreferencesApi['updateLanguage']>
    let updateRefreshModePreference: Mock<PreferencesApi['updateRefreshMode']>
    let updateRefreshMode: Mock<(mode: RefreshModeEnum) => void>
    let refreshMode: WritableSignal<RefreshModeEnum>
    let findProjectById: Mock<ProjectApi['findProjectById']>
    let deleteCurrentUser: Mock<UserApi['deleteCurrentUser']>
    let exportCurrentUser: Mock<UserApi['exportCurrentUser']>
    let downloadJson: Mock<BrowserService['downloadJson']>

    let navigateByUrl: Mock<Router['navigateByUrl']>
    let currentUrl: string
    let applyLanguage: Mock<LanguageService['apply']>
    let rememberLanguage: Mock<LanguageService['remember']>
    let reload: Mock<() => void>
    let startLanguageChange: Mock<(language: string) => void>
    let stopLanguageChange: Mock<() => void>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let updateTheme: Mock<(theme: ThemeEnum) => void>
    let notify: Mock<(message: unknown) => void>
    let resetAll: Mock<() => void>
    let redirect: Mock<(url: string) => void>

    function mockApis (): void {
        getLoginUri = vi.fn( () => of( { uri: '#login' } ) )
        getLogoutUri = vi.fn( () => of( { uri: '#logout' } ) )
        fetchToken = vi.fn( () => of( undefined ) )
        fetchCurrentUser = vi.fn( () => of( USER ) )
        refreshToken = vi.fn( () => of( undefined ) )
        updateThemePreference = vi.fn( () => of( { userId: 'u1', theme: 'DARK', language: 'fr', refreshMode: 'NORMAL' } ) )
        updateLanguagePreference = vi.fn( () => of( { userId: 'u1', theme: 'LIGHT', language: 'en', refreshMode: 'NORMAL' } ) )
        updateRefreshModePreference = vi.fn( () => of( { userId: 'u1', theme: 'LIGHT', language: 'fr', refreshMode: 'FAST' } ) )
        findProjectById = vi.fn( () => of( { id: 'p1' } as ProjectModel ) )
        deleteCurrentUser = vi.fn( () => of( undefined ) )
        exportCurrentUser = vi.fn( () => of( { subjectType: 'USER' } ) )
        downloadJson = vi.fn()
    }

    function mockCollaborators (): void {
        currentUrl = '/current?tab=1#top'
        navigateByUrl = vi.fn( () => Promise.resolve( true ) )
        applyLanguage = vi.fn( () => of( {} ) )
        rememberLanguage = vi.fn()
        reload = vi.fn()
        startLanguageChange = vi.fn()
        stopLanguageChange = vi.fn()
        setGlobalError = vi.fn()
        updateTheme = vi.fn()
        updateRefreshMode = vi.fn()
        refreshMode = signal( RefreshModeEnum.NORMAL )
        notify = vi.fn()
        resetAll = vi.fn()
        redirect = vi.fn()
        theme = signal( ThemeEnum.LIGHT )
    }

    function provideApis (): Provider[] {
        return [
            { provide: SecurityApi, useValue: { getLoginUri, getLogoutUri, fetchToken, fetchCurrentUser, refreshToken } },
            { provide: PreferencesApi, useValue: { updateTheme: updateThemePreference, updateLanguage: updateLanguagePreference, updateRefreshMode: updateRefreshModePreference } },
            { provide: ProjectApi, useValue: { findProjectById: findProjectById } },
            { provide: UserApi, useValue: { deleteCurrentUser, exportCurrentUser } },
        ]
    }

    function provideCollaborators (): Provider[] {
        return [
            { provide: ErrorReporter, useValue: { setGlobalError, notify: vi.fn() } },
            { provide: UiFacade, useValue: { theme, refreshMode, updateRefreshMode, setGlobalError, updateTheme, notify, startLanguageChange, stopLanguageChange } },
            { provide: BrowserService, useValue: { get relativeUrl (): string { return currentUrl }, pathname: '/current', origin: 'http://app.test', redirect, reload, downloadJson } },
            { provide: Router, useValue: { navigateByUrl } },
            { provide: LanguageService, useValue: { activeLanguage: 'fr', apply: applyLanguage, remember: rememberLanguage } },
            { provide: ProfileResetService, useValue: { resetAll } },
        ]
    }

    beforeEach( () => {
        sessionStorage.clear()
        RegistryConfig.config = { defaultLanguage: 'fr', languages: [ 'fr', 'en' ], notification: { duration: {} } } as unknown as ConfigModel
        mockApis()
        mockCollaborators()
        TestBed.configureTestingModule( { providers: [ ...provideApis(), ...provideCollaborators() ] } )
        facade = TestBed.inject( SessionFacade )
        session = TestBed.inject( SessionStore )
    } )

    describe( 'redirectToLogin', () => {
        it( 'remembers the current path, clears the session and navigates to the login page', () => {
            // Arrange
            session.setCurrentUser( USER )

            // Act
            facade.redirectToLogin()

            // Assert
            expect( sessionStorage.getItem( REDIRECT_URI ) ).toBe( '/current?tab=1#top' )
            expect( session.currentUser() ).toBeUndefined()
            expect( navigateByUrl ).toHaveBeenCalledWith( '/login' )
        } )

        it.each( [ '/login', '/auth/callback?code=abc' ] )( 'does not remember %s as the page to come back to', (url: string) => {
            // Arrange
            currentUrl = url

            // Act
            facade.redirectToLogin()

            // Assert
            expect( sessionStorage.getItem( REDIRECT_URI ) ).toBeNull()
            expect( navigateByUrl ).toHaveBeenCalledWith( '/login' )
        } )
    } )

    describe( 'login', () => {
        it( 'clears the session and redirects to the identity provider', () => {
            // Arrange
            session.setCurrentUser( USER )

            // Act
            facade.login()

            // Assert
            expect( session.currentUser() ).toBeUndefined()
            expect( redirect ).toHaveBeenCalledWith( '#login' )
        } )

        it( 'shows the global error and stays put when the login uri cannot be fetched', () => {
            // Arrange
            getLoginUri.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.login()

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( FAILURE )
            expect( redirect ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'exportAccount', () => {
        it( 'downloads the data of the signed-in user', () => {
            // Arrange
            const expectedFile: string = 'registry-my-data.json'

            // Act
            facade.exportAccount()

            // Assert
            expect( downloadJson ).toHaveBeenCalledWith( { subjectType: 'USER' }, expectedFile )
        } )

        it( 'notifies the error and downloads nothing when the export fails', () => {
            // Arrange
            exportCurrentUser.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.exportAccount()

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { detail: FAILURE.message } ) )
            expect( downloadJson ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'deleteAccount', () => {
        it( 'deletes the account then signs out', () => {
            // Arrange
            const expectedUrl: string = '#logout'

            // Act
            facade.deleteAccount()

            // Assert
            expect( deleteCurrentUser ).toHaveBeenCalledOnce()
            expect( redirect ).toHaveBeenCalledWith( expectedUrl )
        } )

        it( 'notifies the error and stays signed in when the deletion fails', () => {
            // Arrange
            deleteCurrentUser.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.deleteAccount()

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { detail: FAILURE.message } ) )
            expect( redirect ).not.toHaveBeenCalled()
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

    describe( 'fetchCurrentUser', () => {
        it( 'leaves the redirection to login to the interceptor when the visitor is not signed in', () => {
            // Arrange
            fetchCurrentUser.mockReturnValue( failing( { status: 401, title: 'Unauthorized', message: 'Unauthorized' } as ErrorModel ) )

            // Act
            facade.fetchCurrentUser().subscribe()

            // Assert
            expect( setGlobalError ).not.toHaveBeenCalled()
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
            expect( navigateByUrl ).toHaveBeenCalledWith( '/projects/42', { replaceUrl: true } )
        } )

        it( 'falls back to the home page instead of looping on the callback route', () => {
            // Arrange
            sessionStorage.setItem( REDIRECT_URI, '/auth/callback' )

            // Act
            facade.fetchToken( 'code' )

            // Assert
            expect( navigateByUrl ).toHaveBeenCalledWith( '/', { replaceUrl: true } )
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

        it( 'explains the redirection to the login page when the authorization code is refused', () => {
            // Arrange
            fetchToken.mockReturnValue( failing( { ...FAILURE, status: 401 } as ErrorModel ) )

            // Act
            facade.fetchToken( 'code' )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'global.notifications.sign-in-refused.title', detail: 'global.notifications.sign-in-refused.message' } ) )
            expect( setGlobalError ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'refreshToken', () => {
        it( 'asks the security api for a new token', () => {
            // Arrange
            let completed: boolean = false

            // Act
            facade.refreshToken().subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( refreshToken ).toHaveBeenCalledTimes( 1 )
            expect( completed ).toBe( true )
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
            expect( applyLanguage ).toHaveBeenCalledWith( 'en' )
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

    describe( 'preferences', () => {
        it( 'ignores the theme already displayed', () => {
            // Arrange
            theme.set( ThemeEnum.DARK )

            // Act
            facade.updateCurrentUserTheme( ThemeEnum.DARK )

            // Assert
            expect( updateThemePreference ).not.toHaveBeenCalled()
            expect( updateTheme ).not.toHaveBeenCalled()
        } )

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
        } )

        it( 'exposes the theme displayed, saved or not', () => {
            // Arrange
            theme.set( ThemeEnum.DARK )

            // Act
            const current: ThemeEnum = facade.currentUserTheme()

            // Assert
            expect( current ).toBe( ThemeEnum.DARK )
        } )

        it( 'keeps the theme and explains why it is not saved when saving fails', () => {
            // Arrange
            updateThemePreference.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.updateCurrentUserTheme( ThemeEnum.DARK )

            // Assert
            expect( updateTheme ).toHaveBeenCalledWith( ThemeEnum.DARK )
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( {
                summary: 'global.notifications.THEME_SAVE_FAILED.title',
                data: { reason: 'Message' },
            } ) )
        } )

        it( 'notifies that the theme was not saved when the backend is unavailable', () => {
            // Arrange
            updateThemePreference.mockReturnValue( failing( UNAVAILABLE ) )

            // Act
            facade.updateCurrentUserTheme( ThemeEnum.DARK )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'global.notifications.THEME_SAVE_FAILED.title' } ) )
        } )

        it( 'offers the light, dark and system themes', () => {
            // Arrange
            const expectedThemes: ThemeEnum[] = [ ThemeEnum.LIGHT, ThemeEnum.DARK, ThemeEnum.SYSTEM ]

            // Act
            const themes: ThemeEnum[] = facade.themeChoices.map( (choice: ThemeChoiceModel): ThemeEnum => choice.theme )

            // Assert
            expect( themes ).toEqual( expectedThemes )
        } )

        it( 'offers the configured languages', () => {
            // Arrange
            const expectedLanguages: readonly string[] = RegistryConfig.config.languages

            // Act
            const languages: readonly string[] = facade.availableLanguages

            // Assert
            expect( languages ).toEqual( expectedLanguages )
        } )

        it( 'saves the language, remembers it and reloads the page', () => {
            // Arrange
            const language: string = 'en'

            // Act
            facade.updateCurrentUserLanguage( language )

            // Assert
            expect( updateLanguagePreference ).toHaveBeenCalledWith( 'en' )
            expect( rememberLanguage ).toHaveBeenCalledWith( 'en' )
            expect( startLanguageChange ).toHaveBeenCalledWith( 'en' )
            expect( reload ).toHaveBeenCalledOnce()
        } )

        it( 'does nothing when the language is already the user one', () => {
            // Arrange
            session.setCurrentUser( USER )

            // Act
            facade.updateCurrentUserLanguage( 'fr' )

            // Assert
            expect( updateLanguagePreference ).not.toHaveBeenCalled()
            expect( reload ).not.toHaveBeenCalled()
        } )

        it( 'neither remembers the language nor reloads when the save fails', () => {
            // Arrange
            updateLanguagePreference.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.updateCurrentUserLanguage( 'en' )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
            expect( stopLanguageChange ).toHaveBeenCalledOnce()
            expect( rememberLanguage ).not.toHaveBeenCalled()
            expect( reload ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'setCurrentProject', () => {
        it( 'clears the project and completes at once when no id is given', () => {
            // Arrange
            session.setCurrentProject( 'p1', { id: 'p1' } as ProjectModel )
            let completed: boolean = false

            // Act
            facade.setCurrentProject( undefined ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( facade.currentProjectId() ).toBeUndefined()
            expect( resetAll ).toHaveBeenCalledTimes( 1 )
            expect( completed ).toBe( true )
        } )

        it( 'loads the profile of the project and stores it', () => {
            // Arrange
            let completed: boolean = false

            // Act
            facade.setCurrentProject( 'p1' ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( findProjectById ).toHaveBeenCalledWith( 'p1' )
            expect( facade.currentProjectId() ).toBe( 'p1' )
            expect( completed ).toBe( true )
        } )

        it( 'releases the caller of a superseded call without keeping its result', () => {
            // Arrange
            const slow: Subject<ProjectModel> = new Subject<ProjectModel>()
            findProjectById.mockReturnValueOnce( slow )
            let firstCompleted: boolean = false
            facade.setCurrentProject( 'p1' ).subscribe( { complete: (): void => { firstCompleted = true } } )

            // Act
            facade.setCurrentProject( 'p2' ).subscribe()
            slow.next( { id: 'late' } as ProjectModel )

            // Assert
            expect( firstCompleted ).toBe( true )
            expect( facade.currentProjectId() ).toBe( 'p2' )
        } )

        it( 'shows the global error and completes when the profile cannot be loaded', () => {
            // Arrange
            findProjectById.mockReturnValue( failing( FAILURE ) )
            let completed: boolean = false

            // Act
            facade.setCurrentProject( 'p1' ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( FAILURE )
            expect( completed ).toBe( true )
        } )
    } )

    describe( 'session state', () => {
        it( 'falls back to the default language when the user has no preference', () => {
            // Arrange
            session.setCurrentUser( { id: 'u1', preferences: {} } as CurrentUserModel )

            // Act
            const language: string = facade.currentUserLanguage()

            // Assert
            expect( language ).toBe( 'fr' )
        } )

        it( 'exposes the selected project', () => {
            // Arrange
            session.setCurrentProject( 'p1', { id: 'p1' } as ProjectModel )

            // Act
            const projectId: string | undefined = facade.selectedProject()?.id

            // Assert
            expect( projectId ).toBe( 'p1' )
            expect( facade.currentProjectId() ).toBe( 'p1' )
        } )

        it( 'tells that the selected project has an option it enables', () => {
            // Arrange
            session.setCurrentProject( 'p1', { id: 'p1', options: [ { label: 'Vehicles', value: ProjectOptionEnum.VEHICLE } ] } as unknown as ProjectModel )

            // Act
            const result: boolean = facade.selectedProjectHasOption( ProjectOptionEnum.VEHICLE )()

            // Assert
            expect( result ).toBe( true )
        } )

        it( 'tells that the selected project lacks an option it does not enable', () => {
            // Arrange
            session.setCurrentProject( 'p1', { id: 'p1', options: [ { label: 'Alerts', value: ProjectOptionEnum.ALERT } ] } as unknown as ProjectModel )

            // Act
            const result: boolean = facade.selectedProjectHasOption( ProjectOptionEnum.VEHICLE )()

            // Assert
            expect( result ).toBe( false )
        } )

        it( 'tells that no option is available when no project is selected', () => {
            // Arrange
            session.setCurrentProject( undefined, undefined )

            // Act
            const result: boolean = facade.selectedProjectHasOption( ProjectOptionEnum.VEHICLE )()

            // Assert
            expect( result ).toBe( false )
        } )

        it( 'emits the current user once it is known', () => {
            // Arrange
            const emitted: string[] = []
            facade.currentUser$.subscribe( (user: CurrentUserModel): number => emitted.push( user.id ) )

            // Act
            session.setCurrentUser( { id: 'u1' } as CurrentUserModel )

            // Assert
            expect( emitted ).toEqual( [ 'u1' ] )
        } )
    } )
    describe( 'updateCurrentUserRefreshMode', () => {
        it( 'ignores the mode already applied', () => {
            // Arrange
            refreshMode.set( RefreshModeEnum.FAST )

            // Act
            facade.updateCurrentUserRefreshMode( RefreshModeEnum.FAST )

            // Assert
            expect( updateRefreshModePreference ).not.toHaveBeenCalled()
            expect( updateRefreshMode ).not.toHaveBeenCalled()
        } )

        it( 'applies the mode immediately and saves it on the user', () => {
            // Arrange
            session.setCurrentUser( USER )

            // Act
            facade.updateCurrentUserRefreshMode( RefreshModeEnum.FAST )

            // Assert
            expect( updateRefreshMode ).toHaveBeenCalledWith( RefreshModeEnum.FAST )
            expect( updateRefreshModePreference ).toHaveBeenCalledWith( RefreshModeEnum.FAST )
            expect( session.currentUser()?.preferences.refreshMode ).toBe( 'FAST' )
        } )

        it( 'keeps the mode applied when saving fails', () => {
            // Arrange
            updateRefreshModePreference.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.updateCurrentUserRefreshMode( RefreshModeEnum.ECO )

            // Assert
            expect( updateRefreshMode ).toHaveBeenCalledWith( RefreshModeEnum.ECO )
        } )
    } )

    describe( 'refreshCurrentProject', () => {
        it( 'reloads the selected project silently', () => {
            // Arrange
            session.setCurrentProject( 'p1', { id: 'old' } as ProjectModel )

            // Act
            facade.refreshCurrentProject()

            // Assert
            expect( findProjectById ).toHaveBeenCalledWith( 'p1' )
            expect( session.currentProject.project() ).toEqual( { id: 'p1' } )
        } )

        it( 'does nothing without a selected project', () => {
            // Arrange
            session.setCurrentProject( undefined, undefined )

            // Act
            facade.refreshCurrentProject()

            // Assert
            expect( findProjectById ).not.toHaveBeenCalled()
        } )

        it( 'keeps the project shown when the reload fails', () => {
            // Arrange
            session.setCurrentProject( 'p1', { id: 'old' } as ProjectModel )
            findProjectById.mockReturnValue( failing( FAILURE ) )

            // Act
            facade.refreshCurrentProject()

            // Assert
            expect( session.currentProject.project() ).toEqual( { id: 'old' } )
            expect( setGlobalError ).not.toHaveBeenCalled()
        } )
    } )
} )
