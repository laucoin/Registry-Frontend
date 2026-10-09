import { computed, inject, Injectable, Signal } from '@angular/core'
import { Router } from '@angular/router'
import {TranslocoService} from '@jsverse/transloco'
import {
    catchError,
    EMPTY,
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
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { PageModel } from '@shared/models/model/page.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { AuthenticationUriModel } from '@shared/models/model/authentication-uri.model'
import { PreferencesModel } from '@shared/models/model/preferences.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { SecurityApi } from '@core/authentication/service/security.api'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { UserApi } from '@pages/users/data/state/user.api'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { PreferencesApi } from '@core/registry/state/preferences.api'
import { BrowserService } from '@core/browser/browser.service'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { SessionStore } from '@core/registry/state/session.store'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SessionStorageUtils } from '@shared/helpers/session-storage.helper'
import { REDIRECT_URI } from '@shared/helpers/request.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { initialize, reportError } from '@shared/helpers/rx.helper'

/**
 * Purpose: Orchestrates the flows that cross the session and the shell: sign-in and sign-out, current user and project loading, theme and language preferences, profile commands.
 * Scope: Calls the backend APIs for those flows and updates the session store and the UI facade accordingly.
 * Limits: Holds no display or session state of its own; consumers read state from the UI and session facades.
 */
@Injectable()
export class RegistryFacade {
    private readonly translateService: TranslocoService = inject(TranslocoService)
    private readonly router: Router = inject(Router)
    private readonly datePipe: CustomDateFormatPipe = inject(CustomDateFormatPipe)
    private readonly profileReset: ProfileResetService = inject(ProfileResetService)
    private readonly uiFacade: UiFacade = inject(UiFacade)
    private readonly browser: BrowserService = inject(BrowserService)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    private readonly securityApi: SecurityApi = inject(SecurityApi)
    private readonly userApi: UserApi = inject(UserApi)
    private readonly userProjectProfileApi: UserProjectProfileApi = inject(UserProjectProfileApi)
    private readonly preferencesApi: PreferencesApi = inject(PreferencesApi)

    private readonly session: InstanceType<typeof SessionStore> = inject(SessionStore)

    private pendingProject: { subscription: Subscription, done: ReplaySubject<void> } | undefined = undefined

    public readonly currentUserTheme: Signal<ThemeEnum | undefined> = computed((): ThemeEnum | undefined => {
        const userTheme: string | undefined = this.sessionFacade.currentUser()?.preferences?.theme
        return GenericHelper.nonNull(userTheme) ? CurrentUserHelper.mapThemeToEnum(userTheme!) : this.uiFacade.theme()
    })

    public login(): void {
        SessionStorageUtils.set(REDIRECT_URI, this.browser.pathname)
        this.session.reset()

        this.securityApi.getLoginUri(`${this.browser.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`).pipe(
            initialize((): void => this.uiFacade.startGlobalLoader()),
            finalize((): void => this.uiFacade.stopGlobalLoader()),
            tap((uri: AuthenticationUriModel): void => {
                this.browser.redirect(uri.uri)
            }),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    public logout(): void {
        this.securityApi.getLogoutUri(this.browser.origin).pipe(
            initialize((): void => this.uiFacade.startGlobalLoader()),
            finalize((): void => this.uiFacade.stopGlobalLoader()),
            tap((uri: AuthenticationUriModel): void => {
                this.browser.redirect(uri.uri)
            }),
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
            tap((): void => {
                const redirectUri: string = (SessionStorageUtils.get(REDIRECT_URI) as string | undefined) ?? RegistryRouteEnum.PROJECTS
                this.router.navigateByUrl(!redirectUri.includes(RegistryRouteEnum.AUTH_CALLBACK) ? redirectUri : RegistryRouteEnum.PROJECTS)
                    .then((): void => SessionStorageUtils.delete(REDIRECT_URI))
            }),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    // Runs eagerly and replays its completion, like a dispatched action: callers may ignore or chain on the result.
    public fetchCurrentUser(): Observable<void> {
        return this.eager(
            this.securityApi.fetchCurrentUser().pipe(
                initialize((): void => this.uiFacade.startGlobalLoader()),
                finalize((): void => this.uiFacade.stopGlobalLoader()),
                tap((currentUser: CurrentUserModel): void => this.onCurrentUser(currentUser)),
                map((): void => undefined),
                catchError((error: ErrorModel): Observable<void> => {
                    this.uiFacade.setGlobalError(error)
                    return of(undefined)
                }),
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
        if (GenericHelper.isNull(theme)) return

        this.uiFacade.updateTheme(theme!)
        this.preferencesApi.updateTheme(CurrentUserHelper.mapThemeToString(theme!)).pipe(
            tap((preferences: PreferencesModel): void => this.session.setCurrentUserTheme(preferences.theme)),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public reloadTranslatedData(): void {
        this.fetchCurrentUser()
    }

    public updateCurrentUserLanguage(language: string): void {
        this.applyLanguage(language)
        this.preferencesApi.updateLanguage(language).pipe(
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public manageProjectInvitationAcceptance(id: string, accepted: boolean): void {
        this.userProjectProfileApi.manageUserProjectProfileAcceptance(id, accepted).pipe(
            initialize((): void => this.session.startProfileLoader()),
            finalize((): void => this.session.stopProfileLoader()),
            tap((profile: ProjectProfileModel): void => {
                this.notifyProfile(
                    `project-profiles.notifications.acceptance.${profile.status.value}.title`,
                    `project-profiles.notifications.acceptance.${profile.status.value}.message`,
                    'pi pi-user',
                )
                this.fetchCurrentUser()
                this.refreshProfilesPage()
                this.refreshInvitationsPage()
            }),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
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
        const subscription: Subscription = this.userProjectProfileApi.findUserProjectProfileByProjectId(projectId!).pipe(
            initialize((): void => this.uiFacade.startGlobalLoader()),
            finalize((): void => this.uiFacade.stopGlobalLoader()),
            tap((profile: ProjectProfileModel): void => this.session.setCurrentProject(projectId, profile)),
            map((): void => undefined),
            catchError((error: ErrorModel): Observable<void> => {
                this.uiFacade.setGlobalError(error)
                return of(undefined)
            }),
        ).subscribe(done)
        this.pendingProject = {subscription: subscription, done: done}

        return done.asObservable()
    }

    public deleteUserProjectProfile(profile: ProjectProfileModel): Observable<void> {
        return this.eager(
            this.userProjectProfileApi.deleteUserProfileById(profile.id).pipe(
                initialize((): void => this.session.startProfileLoader()),
                finalize((): void => this.session.stopProfileLoader()),
                tap((): void => {
                    this.notifyProfile(
                        'project-profiles.notifications.delete.title',
                        'project-profiles.notifications.delete.message.myself',
                        'pi pi-user',
                        {name: profile.project.name},
                    )
                    this.fetchCurrentUser()
                    this.refreshProfilesPage()
                }),
                catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
            ),
        )
    }

    public createSupportProjectProfile(projectId: string): Observable<void> {
        this.profileReset.resetAll()

        return this.eager(
            this.userProjectProfileApi.createSupportProjectProfile(projectId).pipe(
                tap((profile: ProjectProfileModel): void => this.notifyProfile(
                    'projects.notifications.create-support.title',
                    'projects.notifications.create-support.message',
                    'pi pi-user-plus',
                    {
                        name: profile?.project?.name,
                        end: this.datePipe.transform(profile?.endAccess),
                    },
                )),
                switchMap((): Observable<void> => this.fetchCurrentUser()),
                catchError((error: ErrorModel): Observable<void> => this.reportError$(error)),
            ),
        )
    }

    private onCurrentUser(currentUser: CurrentUserModel): void {
        this.session.setCurrentUser(currentUser)

        const userTheme: ThemeEnum = CurrentUserHelper.mapThemeToEnum(currentUser.preferences.theme)
        if (userTheme !== this.uiFacade.theme()) {
            this.uiFacade.updateTheme(userTheme)
        }

        const userLanguage: string | undefined = currentUser.preferences.language
        if (GenericHelper.nonNull(userLanguage) && userLanguage !== this.translateService.getActiveLang()) {
            this.applyLanguage(userLanguage)
        }
    }

    private applyLanguage(language: string): void {
        this.translateService.load(language).pipe(
            tap((): TranslocoService => this.translateService.setActiveLang(language)),
            tap((): void => this.uiFacade.updateLanguage(language)),
            tap((): void => this.reloadTranslatedData()),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    private notifyProfile(summary: string, detail: string, icon: string, data?: object): void {
        this.uiFacade.notify(StateHelper.buildNotificationMessage(SeverityEnum.SUCCESS, summary, detail, icon, data))
    }

    private refreshProfilesPage(): void {
        const page: PageModel<ProjectProfileModel> | undefined = this.sessionFacade.userProjectProfilesPage()
        this.sessionFacade.fetchProjectProfilesPage(page?.pageNumber, page?.pageSize)
    }

    private refreshInvitationsPage(): void {
        const page: PageModel<ProjectProfileModel> | undefined = this.sessionFacade.userProjectProfileInvitationsPage()
        this.sessionFacade.fetchProjectProfileInvitationPage(page?.pageNumber, page?.pageSize)
    }

    private releasePendingProject(): void {
        if (this.pendingProject) {
            this.pendingProject.subscription.unsubscribe()
            this.pendingProject.done.next(undefined)
            this.pendingProject.done.complete()
            this.pendingProject = undefined
        }
    }

    private eager<T>(source: Observable<T>): Observable<T> {
        const result: ReplaySubject<T> = new ReplaySubject<T>()
        source.subscribe(result)
        return result.asObservable()
    }

    private globalError$(error: ErrorModel): Observable<never> {
        this.uiFacade.setGlobalError(error)
        return EMPTY
    }

    private reportError$(error: ErrorModel): Observable<never> {
        reportError(this.uiFacade, error)
        return EMPTY
    }
}
