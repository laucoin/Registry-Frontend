import { computed, inject, Injectable, Signal } from '@angular/core'
import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { PrimeNG } from 'primeng/config'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
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
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { PageModel } from '@shared/models/model/page.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { AuthenticationUriModel } from '@shared/models/model/authentication-uri.model'
import { PreferencesModel } from '@shared/models/model/preferences.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { SecurityApi } from '@core/authentication/service/security.api'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { UserApi } from '@pages/users/data/state/user.api'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { PreferencesApi } from '@core/registry/state/preferences.api'
import { UiStore } from '@core/registry/state/ui.store'
import { NotificationStore } from '@core/registry/state/notification.store'
import { MetadataStore } from '@core/registry/state/metadata.store'
import { SessionStore } from '@core/registry/state/session.store'
import { UserProfileStore } from '@core/registry/state/user-profile.store'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'
import { selectState } from '@shared/helpers/store/state-observable.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SessionStorageUtils } from '@shared/helpers/session-storage.helper'
import { REDIRECT_URI } from '@shared/helpers/request.helper'
import { DateHelper } from '@shared/helpers/date.helper'
import { StringHelper } from '@shared/helpers/string.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { initialize, reportError } from '@shared/helpers/rx.helper'

@Injectable()
export class RegistryFacade {
    private readonly translateService: TranslateService = inject(TranslateService)
    private readonly primeConfig: PrimeNG = inject(PrimeNG)
    private readonly router: Router = inject(Router)
    private readonly datePipe: CustomDateFormatPipe = inject(CustomDateFormatPipe)
    private readonly profileReset: ProfileResetService = inject(ProfileResetService)

    private readonly securityApi: SecurityApi = inject(SecurityApi)
    private readonly userApi: UserApi = inject(UserApi)
    private readonly userProjectProfileApi: UserProjectProfileApi = inject(UserProjectProfileApi)
    private readonly preferencesApi: PreferencesApi = inject(PreferencesApi)

    private readonly ui: InstanceType<typeof UiStore> = inject(UiStore)
    private readonly notifications: InstanceType<typeof NotificationStore> = inject(NotificationStore)
    private readonly metadata: InstanceType<typeof MetadataStore> = inject(MetadataStore)
    private readonly session: InstanceType<typeof SessionStore> = inject(SessionStore)
    private readonly profiles: InstanceType<typeof UserProfileStore> = inject(UserProfileStore)

    private pendingProject: { subscription: Subscription, done: ReplaySubject<void> } | undefined = undefined

    private readonly onlineMessage: ToastMessageOptions = StateHelper.buildNotificationMessage(
        SeverityEnum.SUCCESS,
        'global.notifications.ONLINE.title',
        'global.notifications.ONLINE.message',
        'pi pi-sort-alt',
    )
    private readonly offlineMessage: ToastMessageOptions = StateHelper.buildNotificationMessage(
        SeverityEnum.WARNING,
        'global.notifications.OFFLINE.title',
        'global.notifications.OFFLINE.message',
        'pi pi-sort-alt-slash',
    )

    public readonly theme: Signal<ThemeEnum> = this.ui.theme
    public readonly tinyScreen: Signal<boolean> = computed((): boolean => this.ui.screenWidth() < 768)
    public readonly globalLoading: Signal<boolean> = this.ui.loading
    public readonly globalError: Signal<ToastMessageOptions | undefined> = this.ui.error
    private readonly online: Signal<boolean | undefined> = this.ui.online

    public readonly logoPath: Signal<string> = computed((): string => {
        switch (true) {
            case this.theme() === ThemeEnum.DARK && this.tinyScreen():
                return RegistryConfig.config.logo.small.dark
            case this.theme() === ThemeEnum.DARK && !this.tinyScreen():
                return RegistryConfig.config.logo.normal.dark
            case this.theme() === ThemeEnum.LIGHT && this.tinyScreen():
                return RegistryConfig.config.logo.small.light
            default:
                return RegistryConfig.config.logo.normal.light
        }
    })

    public readonly notification: Observable<ToastMessageOptions> = this.notifications.messages$()

    public readonly currentUser: Signal<CurrentUserModel | undefined> = this.session.currentUser
    public readonly currentUser$: Observable<CurrentUserModel> = selectState(
        this.session,
        (state: { currentUser: CurrentUserModel | undefined }): CurrentUserModel | undefined => state.currentUser,
    ).pipe(
        filter((user: CurrentUserModel | undefined): boolean => GenericHelper.nonNull(user)),
        map((user: CurrentUserModel | undefined): CurrentUserModel => user!),
    )

    public readonly currentUserTheme: Signal<ThemeEnum | undefined> = computed((): ThemeEnum | undefined => {
        const userTheme: string | undefined = this.currentUser()?.preferences?.theme
        return GenericHelper.nonNull(userTheme) ? CurrentUserHelper.mapThemeToEnum(userTheme!) : this.ui.theme()
    })
    public readonly currentUserLanguage: Signal<string> = computed((): string =>
        this.currentUser()?.preferences?.language ?? RegistryConfig.config.defaultLanguage,
    )
    public readonly selectedProject: Signal<ProjectModel | undefined> = computed((): ProjectModel | undefined =>
        this.session.currentProject.profile()?.project,
    )
    public readonly currentProjectId: Signal<string | undefined> = this.session.currentProject.id

    public readonly userProjectProfilesPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.profiles.profiles.element
    public readonly userProjectProfilesPageLoading: Signal<boolean> = this.profiles.profiles.loading
    public readonly userProjectProfilesPageSilentLoading: Signal<boolean> = this.profiles.profiles.silentLoading
    public readonly userProjectProfilesPageError: Signal<ToastMessageOptions | undefined> = this.profiles.profiles.error
    public readonly userProjectProfilesPageResetSearch: Signal<boolean> = this.profiles.profiles.params.resetSearch
    public readonly userProjectProfilesPageTextSearchParam: Signal<string | undefined> = this.profiles.profiles.params.textSearched
    public readonly userProjectProfilesPageDateTimeSearchParam: Signal<Date | undefined> = computed((): Date | undefined =>
        DateHelper.buildDate(this.profiles.profiles.params.dateTimeSearched()),
    )
    public readonly userProjectProfilesPageAvailabilitySearchParam: Signal<boolean | undefined> = this.profiles.profiles.params.availabilitySearched

    public readonly userProjectProfileInvitationsPage: Signal<PageModel<ProjectProfileModel> | undefined> = this.profiles.invitations.element
    public readonly userProjectProfileInvitationsPageLoading: Signal<boolean> = this.profiles.invitations.loading
    public readonly userProjectProfileInvitationsPageSilentLoading: Signal<boolean> = this.profiles.invitations.silentLoading
    public readonly userProjectProfileInvitationsPageError: Signal<ToastMessageOptions | undefined> = this.profiles.invitations.error
    public readonly userProjectProfileInvitationsPageResetSearch: Signal<boolean> = this.profiles.invitations.params.resetSearch
    public readonly userProjectProfileInvitationsPageTextSearchParam: Signal<string | undefined> = this.profiles.invitations.params.textSearched
    public readonly userProjectProfileInvitationsPageDateTimeSearchParam: Signal<Date | undefined> = computed((): Date | undefined =>
        DateHelper.buildDate(this.profiles.invitations.params.dateTimeSearched()),
    )

    public readonly themesMetadata: Signal<SelectItem<ThemeEnum>[]> = this.metadata.themes
    public readonly languagesMetadata: Signal<SelectItem<string>[]> = computed((): SelectItem<string>[] =>
        this.metadata.languages().map((lang: SelectItem<string>): SelectItem<string> => ({
            ...lang,
            label: this.translateService.instant(lang.label!),
        })),
    )

    public startGlobalLoader(): void {
        this.ui.startGlobalLoader()
    }

    public stopGlobalLoader(): void {
        this.ui.stopGlobalLoader()
    }

    public setGlobalError(error: ErrorModel): void {
        this.ui.setGlobalError(error)
    }

    public updateNetwork(online: boolean): void {
        if (this.online() != undefined) {
            this.notify(online ? this.onlineMessage : this.offlineMessage)
        }
        this.ui.updateNetwork(online)
    }

    public updateScreenWidth(screenWidth: number): void {
        this.ui.updateScreenWidth(screenWidth)
    }

    public notify(message: ToastMessageOptions): void {
        if (message.summary?.endsWith('401')) {
            return
        }

        let formattedMessage: ToastMessageOptions = message
        if (StringHelper.isNullOrBlank(message.detail) && StringHelper.isNullOrBlank(message.summary)) {
            formattedMessage = {
                ...message,
                detail: this.translateService.instant('global.notifications.UNKNOWN_ERROR'),
            }
        }

        this.notifications.notify(formattedMessage)
    }

    public startCurrentUserActionLoader(): void {
        this.session.startActionLoader()
    }

    public stopCurrentUserActionLoader(): void {
        this.session.stopActionLoader()
    }

    public login(): void {
        SessionStorageUtils.set(REDIRECT_URI, location.pathname)
        this.session.reset()
        this.profiles.reset()

        this.securityApi.getLoginUri(`${location.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`).pipe(
            initialize((): void => this.ui.startGlobalLoader()),
            finalize((): void => this.ui.stopGlobalLoader()),
            tap((uri: AuthenticationUriModel): void => {
                window.location.href = uri.uri
            }),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    public logout(): void {
        this.securityApi.getLogoutUri(location.origin).pipe(
            initialize((): void => this.ui.startGlobalLoader()),
            finalize((): void => this.ui.stopGlobalLoader()),
            tap((uri: AuthenticationUriModel): void => {
                window.location.href = uri.uri
            }),
            catchError((error: ErrorModel): Observable<never> => this.globalError$(error)),
        ).subscribe()
    }

    public fetchToken(authorizationCode: string): void {
        this.securityApi.fetchToken({
            authorizationCode: authorizationCode,
            redirectUri: `${location.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`,
        }).pipe(
            initialize((): void => this.ui.startGlobalLoader()),
            finalize((): void => this.ui.stopGlobalLoader()),
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
                initialize((): void => this.ui.startGlobalLoader()),
                finalize((): void => this.ui.stopGlobalLoader()),
                tap((currentUser: CurrentUserModel): void => this.onCurrentUser(currentUser)),
                map((): void => undefined),
                catchError((error: ErrorModel): Observable<void> => {
                    this.ui.setGlobalError(error)
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

    public fetchProjectProfilesPage(pageNumber: number | undefined, pageSize: number | undefined): void {
        const index: number | undefined = this.userProjectProfilesPageResetSearch() ? 0 : pageNumber
        this.profiles.fetchProfilesPage({pageNumber: index, pageSize: pageSize})
    }

    public inputProfilesPageSearchParameters(
        textSearched: string | undefined,
        availabilitySearched: boolean | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfilesPageTextSearchParam() != textSearched
            || this.userProjectProfilesPageAvailabilitySearchParam() != availabilitySearched
            || this.userProjectProfilesPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.profiles.updateProfilesPageSearchParams({
                resetSearch: resetSearch,
                textSearched: textSearched,
                availabilitySearched: availabilitySearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            })
        }
    }

    public fetchProjectProfileInvitationPage(pageNumber: number | undefined, pageSize: number | undefined): void {
        const index: number | undefined = this.userProjectProfileInvitationsPageResetSearch() ? 0 : pageNumber
        this.profiles.fetchInvitationsPage({pageNumber: index, pageSize: pageSize})
    }

    public inputInvitationsPageSearchParameters(
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfileInvitationsPageTextSearchParam() != textSearched
            || this.userProjectProfileInvitationsPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.profiles.updateInvitationsPageSearchParams({
                resetSearch: resetSearch,
                textSearched: textSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            })
        }
    }

    public updateTheme(theme: ThemeEnum | undefined): void {
        if (GenericHelper.nonNull(theme)) {
            this.ui.updateTheme(theme!)
        }
    }

    public updateCurrentUserTheme(theme: ThemeEnum | undefined): void {
        if (GenericHelper.isNull(theme)) return

        this.ui.updateTheme(theme!)
        this.preferencesApi.updateTheme(CurrentUserHelper.mapThemeToString(theme!)).pipe(
            tap((preferences: PreferencesModel): void => this.session.setCurrentUserTheme(preferences.theme)),
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public reloadTranslatedData(): void {
        this.fetchCurrentUser()
    }

    public updateCurrentUserLanguage(language: string): void {
        this.translateService.use(language)
        this.primeConfig.setTranslation(this.translateService.instant('prime-ng'))
        this.reloadTranslatedData()
        this.preferencesApi.updateLanguage(language).pipe(
            catchError((error: ErrorModel): Observable<never> => this.reportError$(error)),
        ).subscribe()
    }

    public manageProjectInvitationAcceptance(id: string, accepted: boolean): void {
        this.userProjectProfileApi.manageUserProjectProfileAcceptance(id, accepted).pipe(
            initialize((): void => this.profiles.startProfileLoader()),
            finalize((): void => this.profiles.stopProfileLoader()),
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
            initialize((): void => this.ui.startGlobalLoader()),
            finalize((): void => this.ui.stopGlobalLoader()),
            tap((profile: ProjectProfileModel): void => this.session.setCurrentProject(projectId, profile)),
            map((): void => undefined),
            catchError((error: ErrorModel): Observable<void> => {
                this.ui.setGlobalError(error)
                return of(undefined)
            }),
        ).subscribe(done)
        this.pendingProject = {subscription: subscription, done: done}

        return done.asObservable()
    }

    public deleteUserProjectProfile(profile: ProjectProfileModel): Observable<void> {
        return this.eager(
            this.userProjectProfileApi.deleteUserProfileById(profile.id).pipe(
                initialize((): void => this.profiles.startProfileLoader()),
                finalize((): void => this.profiles.stopProfileLoader()),
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
        if (userTheme !== this.ui.theme()) {
            this.ui.updateTheme(userTheme)
        }

        const userLanguage: string | undefined = currentUser.preferences.language
        if (GenericHelper.nonNull(userLanguage) && userLanguage !== this.translateService.currentLang()) {
            this.translateService.use(userLanguage)
            this.primeConfig.setTranslation(this.translateService.instant('prime-ng'))
            this.reloadTranslatedData()
        }
    }

    private notifyProfile(summary: string, detail: string, icon: string, data?: object): void {
        this.notify(StateHelper.buildNotificationMessage(SeverityEnum.SUCCESS, summary, detail, icon, data))
    }

    private refreshProfilesPage(): void {
        const page: PageModel<ProjectProfileModel> | undefined = this.userProjectProfilesPage()
        this.fetchProjectProfilesPage(page?.pageNumber, page?.pageSize)
    }

    private refreshInvitationsPage(): void {
        const page: PageModel<ProjectProfileModel> | undefined = this.userProjectProfileInvitationsPage()
        this.fetchProjectProfileInvitationPage(page?.pageNumber, page?.pageSize)
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
        this.ui.setGlobalError(error)
        return EMPTY
    }

    private reportError$(error: ErrorModel): Observable<never> {
        reportError(this, error)
        return EMPTY
    }
}
