import { computed, inject, Injectable, Signal } from '@angular/core'
import { HttpStatusCode } from '@angular/common/http'
import { Router } from '@angular/router'
import {
    catchError,
    EMPTY,
    filter,
    map,
    mergeMap,
    Observable,
    of,
    ReplaySubject,
    Subscription,
    switchMap,
    tap,
} from 'rxjs'
import { BrowserService } from '@core/browser/browser.service'
import { SecurityApi } from '@core/authentication/service/security.api'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { RegistryConfig } from '@core/config/registry.config'
import { LanguageService } from '@core/language/language.service'
import { PreferencesApi } from '@core/registry/state/preferences.api'
import { SessionStore } from '@core/registry/state/session.store'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ProjectApi } from '@core/registry/state/project.api'
import { UserApi } from '@core/registry/state/user.api'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ProjectHelper } from '@shared/helpers/project.helper'
import { REDIRECT_URI } from '@shared/helpers/request.helper'
import { eager, initialize, reportError } from '@shared/helpers/rx.helper'
import { RouteHelper } from '@shared/helpers/route.helper'
import { SessionStorageUtils } from '@shared/helpers/session-storage.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { selectState } from '@shared/helpers/store/state-observable.helper'
import { THEME_CHOICES } from '@shared/helpers/theme-choices.const'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'
import { AuthenticationUriModel } from '@shared/models/model/authentication-uri.model'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { PreferencesModel } from '@shared/models/model/preferences.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { ThemeChoiceModel } from '@shared/models/model/theme-choice.model'

const UNAUTHORIZED_STATUS: number = 401

/**
 * Purpose: Public entry point for the signed-in user and its session: sign-in and sign-out, current user, selected project, theme and language preferences.
 * Scope: Exposes the session store as signals, calls the backend for the session flows and applies the user's theme and language to the shell.
 * Limits: Does not handle the user's project profiles and invitations; the user profile facade does.
 */
@Injectable( { providedIn: 'root' } )
export class SessionFacade {
    private readonly session: InstanceType<typeof SessionStore> = inject(SessionStore)
    private readonly uiFacade: UiFacade = inject(UiFacade)
    private readonly languageService: LanguageService = inject(LanguageService)
    private readonly router: Router = inject(Router)
    private readonly browser: BrowserService = inject(BrowserService)
    private readonly profileReset: ProfileResetService = inject(ProfileResetService)

    private readonly securityApi: SecurityApi = inject(SecurityApi)
    private readonly projectApi: ProjectApi = inject(ProjectApi)
    private readonly preferencesApi: PreferencesApi = inject(PreferencesApi)
    private readonly userApi: UserApi = inject(UserApi)

    private pendingProject: { subscription: Subscription, done: ReplaySubject<void> } | undefined = undefined

    public readonly currentUser: Signal<CurrentUserModel | undefined> = this.session.currentUser
    public readonly currentUser$: Observable<CurrentUserModel> = selectState(
        this.session,
        (state: { currentUser: CurrentUserModel | undefined }): CurrentUserModel | undefined => state.currentUser,
    ).pipe(
        filter((user: CurrentUserModel | undefined): boolean => GenericHelper.nonNull(user)),
        map((user: CurrentUserModel | undefined): CurrentUserModel => user!),
    )

    public readonly currentUserTheme: Signal<ThemeEnum> = this.uiFacade.theme
    public readonly themeChoices: readonly ThemeChoiceModel[] = THEME_CHOICES
    public readonly currentUserRefreshMode: Signal<RefreshModeEnum> = this.uiFacade.refreshMode
    public readonly currentUserLanguage: Signal<string> = computed((): string =>
        this.currentUser()?.preferences?.language ?? RegistryConfig.config.defaultLanguage,
    )
    public readonly availableLanguages: readonly string[] = RegistryConfig.config.languages
    public readonly pendingLanguage: Signal<string | undefined> = this.uiFacade.pendingLanguage

    public readonly selectedProject: Signal<ProjectModel | undefined> = computed((): ProjectModel | undefined =>
        this.session.currentProject.project(),
    )
    public readonly currentProjectId: Signal<string | undefined> = this.session.currentProject.id

    public selectedProjectHasOption(option: ProjectOptionEnum): Signal<boolean> {
        return computed((): boolean => {
            const project: ProjectModel | undefined = this.selectedProject()
            return GenericHelper.nonNull(project) && ProjectHelper.hasOption(project, option)
        })
    }

    public redirectToLogin(): void {
        const current: string = this.browser.relativeUrl
        if (!current.includes(RegistryRouteEnum.LOGIN) && !current.includes(RegistryRouteEnum.AUTH_CALLBACK)) {
            SessionStorageUtils.set(REDIRECT_URI, current)
        }
        this.session.reset()
        this.router.navigateByUrl(RouteHelper.absolute(RegistryRouteEnum.LOGIN))
    }

    public login(): void {
        this.session.reset()

        this.securityApi.getLoginUri(`${this.browser.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`).pipe(
            tap((uri: AuthenticationUriModel): void => this.browser.redirect(uri.uri)),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    public logout(): void {
        this.securityApi.getLogoutUri(this.browser.origin).pipe(
            tap((uri: AuthenticationUriModel): void => this.browser.redirect(uri.uri)),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    public exportAccount(): void {
        this.userApi.exportCurrentUser().pipe(
            tap((data: unknown): void => this.browser.downloadJson(data, 'registry-my-data.json')),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public deleteAccount(): void {
        this.userApi.deleteCurrentUser().pipe(
            tap((): void => this.logout()),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public refreshToken(): Observable<void> {
        return this.securityApi.refreshToken()
    }

    public fetchToken(authorizationCode: string): void {
        this.securityApi.fetchToken({
            authorizationCode: authorizationCode,
            redirectUri: `${this.browser.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`,
        }).pipe(
            mergeMap((): Observable<CurrentUserModel> => this.securityApi.fetchCurrentUser()),
            tap((currentUser: CurrentUserModel): void => this.onCurrentUser(currentUser)),
            tap((): void => this.navigateAfterSignIn()),
            catchError((error: ErrorModel): Observable<never> => this.signInFailed$(error)),
        ).subscribe()
    }

    public fetchCurrentUser(): Observable<void> {
        return eager(
            this.securityApi.fetchCurrentUser().pipe(
                tap((currentUser: CurrentUserModel): void => this.onCurrentUser(currentUser)),
                map((): void => undefined),
                catchError((error: ErrorModel): Observable<void> => this.globalErrorCompleted$(error)),
            ),
        )
    }

    public updateCurrentUserTheme(theme: ThemeEnum | undefined): void {
        if (GenericHelper.isNull(theme) || theme === this.uiFacade.theme()) return

        this.uiFacade.updateTheme(theme!)
        this.preferencesApi.updateTheme(CurrentUserHelper.mapThemeToString(theme!)).pipe(
            tap((preferences: PreferencesModel): void => this.session.setCurrentUserTheme(preferences.theme)),
            catchError((error: ErrorModel): Observable<never> => this.themeSaveFailed$(error)),
        ).subscribe()
    }

    public updateCurrentUserRefreshMode(refreshMode: RefreshModeEnum): void {
        if (refreshMode === this.uiFacade.refreshMode()) return

        this.uiFacade.updateRefreshMode(refreshMode)
        this.preferencesApi.updateRefreshMode(refreshMode).pipe(
            tap((preferences: PreferencesModel): void => this.session.setCurrentUserRefreshMode(preferences.refreshMode)),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public updateCurrentUserLanguage(language: string): void {
        if (language === this.currentUserLanguage()) return

        this.preferencesApi.updateLanguage(language).pipe(
            initialize((): void => this.uiFacade.startLanguageChange(language)),
            tap((): void => this.languageService.remember(language)),
            tap((): void => this.browser.reload()),
            catchError((error: ErrorModel): Observable<never> => this.languageChangeFailed$(error)),
        ).subscribe()
    }

    public setCurrentProject(projectId: string | undefined): Observable<void> {
        this.profileReset.resetAll()
        this.releasePendingProject()
        this.session.setCurrentProject(projectId, undefined)

        if (GenericHelper.isNull(projectId)) {
            return of(undefined)
        }

        const done: ReplaySubject<void> = new ReplaySubject<void>(1)
        const subscription: Subscription = this.fetchProject$(projectId!).subscribe(done)
        this.pendingProject = {subscription: subscription, done: done}

        return done.asObservable()
    }

    public refreshCurrentProject(): void {
        const projectId: string | undefined = this.currentProjectId()
        if (GenericHelper.isNull(projectId)) return

        this.projectApi.findProjectById(projectId!).pipe(
            tap((project: ProjectModel): void => {
                if (this.currentProjectId() === projectId) this.session.setCurrentProject(projectId, project)
            }),
            catchError((): Observable<never> => EMPTY),
        ).subscribe()
    }

    private fetchProject$(projectId: string): Observable<void> {
        return this.projectApi.findProjectById(projectId).pipe(
            tap((project: ProjectModel): void => this.session.setCurrentProject(projectId, project)),
            map((): void => undefined),
            catchError((error: ErrorModel): Observable<void> => this.globalErrorCompleted$(error)),
        )
    }

    private onCurrentUser(currentUser: CurrentUserModel): void {
        this.session.setCurrentUser(currentUser)

        const userTheme: ThemeEnum = CurrentUserHelper.mapThemeToEnum(currentUser.preferences.theme)
        if (userTheme !== this.uiFacade.theme()) {
            this.uiFacade.updateTheme(userTheme)
        }

        this.uiFacade.updateRefreshMode(CurrentUserHelper.mapRefreshModeToEnum(currentUser.preferences.refreshMode))

        const userLanguage: string | undefined = currentUser.preferences.language
        if (GenericHelper.nonNull(userLanguage) && userLanguage !== this.languageService.activeLanguage) {
            this.applyUserLanguage(userLanguage!)
        }
    }

    private applyUserLanguage(language: string): void {
        this.languageService.apply(language).pipe(
            switchMap((): Observable<void> => this.fetchCurrentUser()),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    private navigateAfterSignIn(): void {
        const redirectUri: string = (SessionStorageUtils.get(REDIRECT_URI) as string | undefined) ?? RegistryRouteEnum.HOME
        this.router.navigateByUrl(!redirectUri.includes(RegistryRouteEnum.AUTH_CALLBACK) ? redirectUri : RegistryRouteEnum.HOME, { replaceUrl: true })
            .then((): void => SessionStorageUtils.delete(REDIRECT_URI))
    }

    private releasePendingProject(): void {
        if (this.pendingProject) {
            this.pendingProject.subscription.unsubscribe()
            this.pendingProject.done.next(undefined)
            this.pendingProject.done.complete()
            this.pendingProject = undefined
        }
    }

    private globalError$(error: ErrorModel): Observable<never> {
        this.showGlobalError(error)
        return EMPTY
    }

    private globalErrorCompleted$(error: ErrorModel): Observable<void> {
        this.showGlobalError(error)
        return of(undefined)
    }

    private showGlobalError(error: ErrorModel): void {
        if (error.status !== UNAUTHORIZED_STATUS) {
            this.uiFacade.setGlobalError(error)
        }
    }

    private languageChangeFailed$(error: ErrorModel): Observable<never> {
        this.uiFacade.stopLanguageChange()
        return this.reportError$(error)
    }

    private themeSaveFailed$(error: ErrorModel): Observable<never> {
        this.notifyThemeNotSaved(error)
        return EMPTY
    }

    private notifyThemeNotSaved(error: ErrorModel): void {
        this.uiFacade.notify(StateHelper.buildNotificationMessage(
            SeverityEnum.ERROR,
            'global.notifications.THEME_SAVE_FAILED.title',
            'global.notifications.THEME_SAVE_FAILED.message',
            { reason: error.message },
        ))
    }

    // A refused authorization code (expired or already used) sends the user back to the login page: say why.
    private signInFailed$(error: ErrorModel): Observable<never> {
        if (error.status !== HttpStatusCode.Unauthorized) return this.globalError$(error)
        this.uiFacade.notify(StateHelper.buildNotificationMessage(
            SeverityEnum.WARNING,
            'global.notifications.sign-in-refused.title',
            'global.notifications.sign-in-refused.message',
        ))
        return EMPTY
    }

    private reportError$(error: ErrorModel): Observable<never> {
        reportError(this.uiFacade, error)
        return EMPTY
    }
}
