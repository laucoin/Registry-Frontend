import { computed, inject, Injectable, Signal } from '@angular/core'
import { Router } from '@angular/router'
import {
    catchError,
    EMPTY,
    filter,
    finalize,
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
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserApi } from '@pages/users/data/state/user.api'
import { GenericHelper } from '@shared/helpers/generic.helper'
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
import { AuthenticationUriModel } from '@shared/models/model/authentication-uri.model'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { PreferencesModel } from '@shared/models/model/preferences.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ThemeChoiceModel } from '@shared/models/model/theme-choice.model'

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
    private readonly userApi: UserApi = inject(UserApi)
    private readonly userProjectProfileApi: UserProjectProfileApi = inject(UserProjectProfileApi)
    private readonly preferencesApi: PreferencesApi = inject(PreferencesApi)

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
    public readonly currentUserLanguage: Signal<string> = computed((): string =>
        this.currentUser()?.preferences?.language ?? RegistryConfig.config.defaultLanguage,
    )
    public readonly availableLanguages: readonly string[] = RegistryConfig.config.languages
    public readonly pendingLanguage: Signal<string | undefined> = this.uiFacade.pendingLanguage

    public readonly selectedProject: Signal<ProjectModel | undefined> = computed((): ProjectModel | undefined =>
        this.session.currentProject.profile()?.project,
    )
    public readonly currentProjectId: Signal<string | undefined> = this.session.currentProject.id

    public redirectToLogin(): void {
        SessionStorageUtils.set(REDIRECT_URI, this.browser.pathname)
        this.session.reset()
        this.router.navigateByUrl(RouteHelper.absolute(RegistryRouteEnum.LOGIN))
    }

    public login(): void {
        this.session.reset()

        this.securityApi.getLoginUri(`${this.browser.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`).pipe(
            initialize((): void => this.uiFacade.startGlobalLoader()),
            finalize((): void => this.uiFacade.stopGlobalLoader()),
            tap((uri: AuthenticationUriModel): void => this.browser.redirect(uri.uri)),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    public logout(): void {
        this.securityApi.getLogoutUri(this.browser.origin).pipe(
            initialize((): void => this.uiFacade.startGlobalLoader()),
            finalize((): void => this.uiFacade.stopGlobalLoader()),
            tap((uri: AuthenticationUriModel): void => this.browser.redirect(uri.uri)),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
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
            initialize((): void => this.uiFacade.startGlobalLoader()),
            finalize((): void => this.uiFacade.stopGlobalLoader()),
            mergeMap((): Observable<CurrentUserModel> => this.securityApi.fetchCurrentUser()),
            tap((currentUser: CurrentUserModel): void => this.onCurrentUser(currentUser)),
            tap((): void => this.navigateAfterSignIn()),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    public fetchCurrentUser(): Observable<void> {
        return eager(
            this.securityApi.fetchCurrentUser().pipe(
                initialize((): void => this.uiFacade.startGlobalLoader()),
                finalize((): void => this.uiFacade.stopGlobalLoader()),
                tap((currentUser: CurrentUserModel): void => this.onCurrentUser(currentUser)),
                map((): void => undefined),
                catchError((error: ErrorModel): Observable<void> => this.globalErrorCompleted$(error)),
            ),
        )
    }

    public impersonateCurrentUser(): void {
        this.userApi.impersonateCurrentUser().pipe(
            initialize((): void => this.session.startActionLoader()),
            finalize((): void => this.session.stopActionLoader()),
            tap((): void => this.logout()),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public updateCurrentUserTheme(theme: ThemeEnum | undefined): void {
        if (GenericHelper.isNull(theme) || theme === this.uiFacade.theme()) return

        this.uiFacade.updateTheme(theme!)
        this.preferencesApi.updateTheme(CurrentUserHelper.mapThemeToString(theme!)).pipe(
            tap((preferences: PreferencesModel): void => this.session.setCurrentUserTheme(preferences.theme)),
            catchError((error: ErrorModel): Observable<never> => this.themeSaveFailed$(error)),
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

    // Cancels any previous call, like the former `cancelUncompleted` action; the replaced caller is released.
    public setCurrentProject(projectId: string | undefined): Observable<void> {
        this.profileReset.resetAll()
        this.releasePendingProject()
        this.session.setCurrentProject(projectId, undefined)

        if (GenericHelper.isNull(projectId)) {
            return of(undefined)
        }

        const done: ReplaySubject<void> = new ReplaySubject<void>(1)
        const subscription: Subscription = this.fetchProjectProfile$(projectId!).subscribe(done)
        this.pendingProject = {subscription: subscription, done: done}

        return done.asObservable()
    }

    private fetchProjectProfile$(projectId: string): Observable<void> {
        return this.userProjectProfileApi.findUserProjectProfileByProjectId(projectId).pipe(
            initialize((): void => this.uiFacade.startGlobalLoader()),
            finalize((): void => this.uiFacade.stopGlobalLoader()),
            tap((profile: ProjectProfileModel): void => this.session.setCurrentProject(projectId, profile)),
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
        const redirectUri: string = (SessionStorageUtils.get(REDIRECT_URI) as string | undefined) ?? RegistryRouteEnum.PROJECTS
        this.router.navigateByUrl(!redirectUri.includes(RegistryRouteEnum.AUTH_CALLBACK) ? redirectUri : RegistryRouteEnum.PROJECTS)
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
        this.uiFacade.setGlobalError(error)
        return EMPTY
    }

    private globalErrorCompleted$(error: ErrorModel): Observable<void> {
        this.uiFacade.setGlobalError(error)
        return of(undefined)
    }

    private languageChangeFailed$(error: ErrorModel): Observable<never> {
        this.uiFacade.stopLanguageChange()
        return this.reportError$(error)
    }

    private themeSaveFailed$(error: ErrorModel): Observable<never> {
        if (error.status === 503) return this.reportError$(error)

        this.notifyThemeNotSaved(error)
        return EMPTY
    }

    private notifyThemeNotSaved(error: ErrorModel): void {
        this.uiFacade.notify(StateHelper.buildNotificationMessage(
            SeverityEnum.ERROR,
            'global.notifications.THEME_SAVE_FAILED.title',
            'global.notifications.THEME_SAVE_FAILED.message',
            undefined,
            { reason: error.message },
        ))
    }

    private reportError$(error: ErrorModel): Observable<never> {
        reportError(this.uiFacade, error)
        return EMPTY
    }
}
