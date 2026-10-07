import {inject, Injectable} from '@angular/core'
import {Action, Selector, State, StateContext} from '@ngxs/store'
import {catchError, finalize, map, mergeMap, Observable, of} from 'rxjs'
import {SecurityApi} from '@core/authentication/service/security.api'
import {CurrentUserModel} from '@shared/models/model/current-user.model'
import {ProjectProfileModel} from '@shared/models/model/project-profile.model'
import {PageModel} from '@shared/models/model/page.model'
import {GenericStore} from '@shared/helpers/state/generic.store'
import {REDIRECT_URI} from '@shared/helpers/request.helper'
import {initialize} from '@shared/helpers/rx.helper'
import {SessionStorageUtils} from '@shared/helpers/session-storage.helper'
import {RegistryStoreModel} from '@core/registry/model/registry-store.model'
import {
    CreateSupportProjectProfile,
    DeleteUserProjectProfile,
    FetchCurrentUser,
    FetchTokens,
    FetchUserProjectProfileInvitationsPage,
    FetchUserProjectProfilesPage,
    ImpersonateCurrentUser,
    Login,
    Logout,
    ManageUserProjectInvitationAcceptance,
    SetCurrentProject,
    StartCurrentUserActionLoader,
    StartUserProjectProfileInvitationsPageLoader,
    StartUserProjectProfileLoader,
    StartUserProjectProfilesPageLoader,
    StopCurrentUserActionLoader,
    StopUserProjectProfileInvitationsPageLoader,
    StopUserProjectProfileLoader,
    StopUserProjectProfilesPageLoader,
    UpdateCurrentUserLanguage,
    UpdateCurrentUserTheme,
    UpdateUserProjectProfileInvitationsPageSearchParams,
    UpdateUserProjectProfilesPageSearchParams,
} from '@core/registry/state/registry.action'
import {UserProjectProfileApi} from '@core/registry/state/user-project-profile.api'
import {PreferencesApi} from '@core/registry/state/preferences.api'
import {ProjectModel} from '@shared/models/model/project.model'
import {RegistryRouteEnum} from '@core/routing/registry-route.enum'
import {AuthenticationUriModel} from '@shared/models/model/authentication-uri.model'
import {Router} from '@angular/router'
import {ErrorModel} from '@shared/models/model/error.model'
import {UserApi} from '@pages/users/data/state/user.api'
import {ToastMessageOptions} from 'primeng/api'
import {CustomDateFormatPipe} from '@shared/helpers/pipe/custom-date-format.pipe'
import {ProfileStatusEnum} from '@shared/models/enumeration/profile-status.enum'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'
import {ThemeEnum} from '@shared/models/enumeration/theme.enum'
import {RegistryConfig} from '@core/config/registry.config'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {PreferencesModel} from '@shared/models/model/preferences.model'
import {CurrentUserHelper} from '@core/authentication/tool/current-user.helper'
import {PrimeNG} from 'primeng/config'

const defaultRegistryStore: RegistryStoreModel = {
    authentication: {
        currentUser: undefined,
        loading: false,
    },
    currentProject: {
        id: undefined,
        profile: undefined,
    },
    profiles: {
        params: {
            resetSearch: false,
            availabilitySearched: undefined,
            statusSearched: ProfileStatusEnum.ACCEPTED,
            textSearched: undefined,
            dateTimeSearched: undefined,
        },
        element: undefined,
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    invitations: {
        params: {
            resetSearch: false,
            availabilitySearched: undefined,
            statusSearched: ProfileStatusEnum.INVITED,
            textSearched: undefined,
            dateTimeSearched: undefined,
        },
        element: undefined,
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    profile: {
        element: undefined,
        loading: false,
    },
}

@State<RegistryStoreModel>({
    name: 'registry',
    defaults: defaultRegistryStore,
})
@Injectable()
export class RegistryStore extends GenericStore {
    private readonly primeConfig: PrimeNG = inject(PrimeNG)

    private readonly darkModeClass: string = 'dark-mod'
    private readonly htmlElement: HTMLHtmlElement = document.querySelector('html') as HTMLHtmlElement

    private readonly api: SecurityApi = inject(SecurityApi)
    private readonly userProjectProfileApi: UserProjectProfileApi = inject(UserProjectProfileApi)
    private readonly preferencesApi: PreferencesApi = inject(PreferencesApi)
    private readonly userApi: UserApi = inject(UserApi)
    private readonly router: Router = inject(Router)
    private readonly datePipe: CustomDateFormatPipe = inject(CustomDateFormatPipe)








    @Selector()
    public static currentUser(state: RegistryStoreModel): CurrentUserModel | undefined {
        return state.authentication.currentUser
    }


    @Selector()
    public static currentUserLanguage(state: RegistryStoreModel): string {
        return state.authentication.currentUser?.preferences?.language ?? RegistryConfig.config.defaultLanguage
    }

    @Selector()
    public static currentUserSelectedProject(state: RegistryStoreModel): ProjectModel | undefined {
        return state.currentProject.profile?.project
    }

    @Selector()
    public static currentUserSelectedProjectId(state: RegistryStoreModel): string | undefined {
        return state.currentProject.id
    }

    @Selector()
    public static userProjectProfilesPage(state: RegistryStoreModel): PageModel<ProjectProfileModel> | undefined {
        return state.profiles.element
    }

    @Selector()
    public static userProjectProfilesPageLoading(state: RegistryStoreModel): boolean {
        return state.profiles.loading
    }

    @Selector()
    public static userProjectProfilesPageError(state: RegistryStoreModel): ToastMessageOptions | undefined {
        return state.profiles.error
    }

    @Selector()
    public static userProjectProfilesPageSilentLoading(state: RegistryStoreModel): boolean {
        return state.profiles.silentLoading
    }

    @Selector()
    public static userProjectProfilesPageResetSearch(state: RegistryStoreModel): boolean {
        return state.profiles.params.resetSearch
    }

    @Selector()
    public static userProjectProfilesPageTextSearchParam(state: RegistryStoreModel): string | undefined {
        return state.profiles.params.textSearched
    }

    @Selector()
    public static userProjectProfilesPageDateTimeSearchParam(state: RegistryStoreModel): string | undefined {
        return state.profiles.params.dateTimeSearched
    }

    @Selector()
    public static userProjectProfilesPageAvailabilitySearchParam(state: RegistryStoreModel): boolean | undefined {
        return state.profiles.params.availabilitySearched
    }

    @Selector()
    public static userProjectProfileInvitationsPage(state: RegistryStoreModel): PageModel<ProjectProfileModel> | undefined {
        return state.invitations.element
    }

    @Selector()
    public static userProjectProfileInvitationsPageLoading(state: RegistryStoreModel): boolean {
        return state.invitations.loading
    }

    @Selector()
    public static userProjectProfileInvitationsPageError(state: RegistryStoreModel): ToastMessageOptions | undefined {
        return state.invitations.error
    }

    @Selector()
    public static userProjectProfileInvitationsPageSilentLoading(state: RegistryStoreModel): boolean {
        return state.invitations.silentLoading
    }

    @Selector()
    public static userProjectProfileInvitationsPageResetSearch(state: RegistryStoreModel): boolean {
        return state.invitations.params.resetSearch
    }

    @Selector()
    public static userProjectProfileInvitationsPageTextSearchParam(state: RegistryStoreModel): string | undefined {
        return state.invitations.params.textSearched
    }

    @Selector()
    public static userProjectProfileInvitationsPageDateTimeParam(state: RegistryStoreModel): string | undefined {
        return state.invitations.params.dateTimeSearched
    }











    @Action(StartCurrentUserActionLoader)
    public startCurrentUserActionLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateCurrentUserActionLoader(ctx, true)
    }

    @Action(StopCurrentUserActionLoader)
    public stopCurrentUserActionLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateCurrentUserActionLoader(ctx, false)
    }

    private updateCurrentUserActionLoader(ctx: StateContext<RegistryStoreModel>, loading: boolean): void {
        ctx.patchState({
            authentication: {
                ...ctx.getState().authentication,
                loading: loading,
            },
        })
    }

    @Action(Login)
    public login(ctx: StateContext<RegistryStoreModel>): Observable<void> {
        ctx.setState(defaultRegistryStore)
        return this.api.getLoginUri(`${location.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`).pipe(
            initialize((): void => this.registryFacade.startGlobalLoader()),
            finalize((): void => this.registryFacade.stopGlobalLoader()),
            map((uri: AuthenticationUriModel): void => {
                window.location.href = uri.uri
            }),
            catchError((error: ErrorModel): Observable<void> => this.globalError(ctx, error)),
        )
    }

    @Action(Logout)
    public logout(ctx: StateContext<RegistryStoreModel>): Observable<void> {
        return this.api.getLogoutUri(location.origin).pipe(
            initialize((): void => this.registryFacade.startGlobalLoader()),
            finalize((): void => this.registryFacade.stopGlobalLoader()),
            map((uri: AuthenticationUriModel): void => {
                window.location.href = uri.uri
            }),
            catchError((error: ErrorModel): Observable<void> => this.globalError(ctx, error)),
        )
    }

    @Action(FetchTokens)
    public fetchTokens(ctx: StateContext<RegistryStoreModel>, payload: FetchTokens): Observable<void> {
        return this.api.fetchToken({
            authorizationCode: payload.authorizationCode,
            redirectUri: `${location.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`,
        }).pipe(
            initialize((): void => this.registryFacade.startGlobalLoader()),
            finalize((): void => this.registryFacade.stopGlobalLoader()),
            mergeMap((): Observable<CurrentUserModel> => this.api.fetchCurrentUser()),
            map((currentUser: CurrentUserModel): void => this.fetchCurrentUserComplete(ctx, currentUser)),
            map((): void => {
                const redirectUri: string = (SessionStorageUtils.get(REDIRECT_URI) as string | undefined) ?? RegistryRouteEnum.PROJECTS
                this.router.navigateByUrl(!redirectUri.includes(RegistryRouteEnum.AUTH_CALLBACK) ? redirectUri : RegistryRouteEnum.PROJECTS)
                    .then((): void => SessionStorageUtils.delete(REDIRECT_URI))
            }),
            catchError((error: ErrorModel): Observable<void> => this.globalError(ctx, error)),
        )
    }

    @Action(FetchCurrentUser)
    public fetchCurrentUser(ctx: StateContext<RegistryStoreModel>): Observable<void> {
        return this.api.fetchCurrentUser().pipe(
            initialize((): void => this.registryFacade.startGlobalLoader()),
            finalize((): void => this.registryFacade.stopGlobalLoader()),
            map((currentUser: CurrentUserModel): void => this.fetchCurrentUserComplete(ctx, currentUser)),
            catchError((error: ErrorModel): Observable<void> => this.globalError(ctx, error)),
        )
    }

    private fetchCurrentUserComplete(ctx: StateContext<RegistryStoreModel>, currentUser: CurrentUserModel): void {
        ctx.patchState({
            authentication: {
                ...ctx.getState().authentication,
                currentUser: currentUser,
            },
        })
        const userTheme: ThemeEnum = CurrentUserHelper.mapThemeToEnum(currentUser.preferences.theme)
        if (userTheme !== this.registryFacade.theme()) {
            this.registryFacade.updateTheme(userTheme)
        }
        const userLanguage: string | undefined = currentUser.preferences.language
        if (GenericHelper.nonNull(userLanguage) && userLanguage !== this.translateService.currentLang()) {
            this.translateService.use(currentUser.preferences.language)
            this.primeConfig.setTranslation(this.translateService.instant('prime-ng'))
            this.registryFacade.reloadTranslatedData()
        }
    }

    @Action(ImpersonateCurrentUser)
    public impersonateCurrentUser(): Observable<void> {
        return this.userApi.impersonateCurrentUser().pipe(
            initialize((): void => this.registryFacade.startCurrentUserActionLoader()),
            finalize((): void => this.registryFacade.stopCurrentUserActionLoader()),
            map((): void => this.registryFacade.logout()),
        )
    }

    @Action(StartUserProjectProfilesPageLoader)
    public startUserProjectProfilesPageLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateUserProjectProfilesLoader(ctx, true)
    }

    @Action(StopUserProjectProfilesPageLoader)
    public stopUserProjectProfilesPageLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateUserProjectProfilesLoader(ctx, false)
    }

    private updateUserProjectProfilesLoader(ctx: StateContext<RegistryStoreModel>, loading: boolean): void {
        ctx.patchState({
            profiles: {
                ...ctx.getState().profiles, loading: loading,
            },
        })
    }

    @Action(FetchUserProjectProfilesPage)
    public fetchUserProjectProfilesPage(
        ctx: StateContext<RegistryStoreModel>,
        payload: FetchUserProjectProfilesPage,
    ): Observable<void> {
        return this.userProjectProfileApi.findUserProjectProfiles(
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().profiles.params,
        ).pipe(
            initialize((): void => this.registryFacade.startProfilesPageLoader()),
            finalize((): void => this.registryFacade.stopProfilesPageLoader()),
            map((profilePage: PageModel<ProjectProfileModel>): void => this.fetchUserProjectProfilesPageComplete(
                ctx,
                profilePage,
            )),
            catchError((error: ErrorModel): Observable<void> => this.fetchUserProjectProfilesPageError(
                ctx,
                error,
            )),
        )
    }

    private fetchUserProjectProfilesPageComplete(
        ctx: StateContext<RegistryStoreModel>,
        profilePage: PageModel<ProjectProfileModel>,
    ): void {
        ctx.patchState({
            profiles: {
                ...ctx.getState().profiles,
                params: {
                    ...ctx.getState().profiles.params,
                    resetSearch: false,
                },
                element: profilePage,
            },
        })
    }

    private fetchUserProjectProfilesPageError(
        ctx: StateContext<RegistryStoreModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status === 503) {
            throw error
        } else {
            ctx.patchState({
                profiles: this.buildErrorMessage(ctx.getState().profiles, error),
            })
        }

        return of()
    }

    @Action(UpdateUserProjectProfilesPageSearchParams)
    public updateUserProjectProfilesPageSearchParams(
        ctx: StateContext<RegistryStoreModel>,
        payload: UpdateUserProjectProfilesPageSearchParams,
    ): void {
        ctx.patchState({
            profiles: {
                ...ctx.getState().profiles,
                params: {
                    ...ctx.getState().profiles.params,
                    resetSearch: payload.resetSearch,
                    textSearched: payload.textSearched,
                    availabilitySearched: payload.availabilitySearched,
                    dateTimeSearched: payload.dateTimeSearched,
                },
            },
        })
    }

    @Action(StartUserProjectProfileInvitationsPageLoader)
    public startUserProjectProfileInvitationsPageLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateUserProjectProfileInvitationsLoader(ctx, true)
    }

    @Action(StopUserProjectProfileInvitationsPageLoader)
    public stopUserProjectProfileInvitationsPageLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateUserProjectProfileInvitationsLoader(ctx, false)
    }

    private updateUserProjectProfileInvitationsLoader(ctx: StateContext<RegistryStoreModel>, loading: boolean): void {
        ctx.patchState({
            invitations: {
                ...ctx.getState().invitations,
                loading: loading,
            },
        })
    }

    @Action(FetchUserProjectProfileInvitationsPage)
    public fetchUserProjectProfileInvitationsPage(
        ctx: StateContext<RegistryStoreModel>,
        payload: FetchUserProjectProfileInvitationsPage,
    ): Observable<void> {
        return this.userProjectProfileApi.findUserProjectProfiles(
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().invitations.params,
        ).pipe(
            initialize((): void => this.registryFacade.startInvitationsPageLoader()),
            finalize((): void => this.registryFacade.stopInvitationsPageLoader()),
            map((invitationPage: PageModel<ProjectProfileModel>): void => this.fetchUserProjectProfileInvitationsPageComplete(
                ctx,
                invitationPage,
            )),
            catchError((error: ErrorModel): Observable<void> => this.fetchUserProjectProfileInvitationsPageError(
                ctx,
                error,
            )),
        )
    }

    private fetchUserProjectProfileInvitationsPageComplete(
        ctx: StateContext<RegistryStoreModel>,
        invitationPage: PageModel<ProjectProfileModel>,
    ): void {
        ctx.patchState({
            invitations: {
                ...ctx.getState().invitations,
                params: {
                    ...ctx.getState().invitations.params,
                    resetSearch: false,
                },
                element: invitationPage,
            },
        })
    }

    private fetchUserProjectProfileInvitationsPageError(
        ctx: StateContext<RegistryStoreModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status === 503) {
            throw error
        } else {
            ctx.patchState({
                invitations: this.buildErrorMessage(ctx.getState().invitations, error),
            })
        }

        return of()
    }

    @Action(UpdateUserProjectProfileInvitationsPageSearchParams)
    public updateUserProjectProfileInvitationsPageSearchParams(
        ctx: StateContext<RegistryStoreModel>,
        payload: UpdateUserProjectProfileInvitationsPageSearchParams,
    ): void {
        ctx.patchState({
            invitations: {
                ...ctx.getState().invitations,
                params: {
                    ...ctx.getState().invitations.params,
                    resetSearch: payload.resetSearch,
                    textSearched: payload.textSearched,
                    dateTimeSearched: payload.dateTimeSearched,
                },
            },
        })
    }

    @Action(StartUserProjectProfileLoader)
    public startUserProjectProfileLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateUserProjectProfileLoader(ctx, true)
    }

    @Action(StopUserProjectProfileLoader)
    public stopUserProjectProfileLoader(ctx: StateContext<RegistryStoreModel>): void {
        this.updateUserProjectProfileLoader(ctx, false)
    }

    private updateUserProjectProfileLoader(ctx: StateContext<RegistryStoreModel>, loading: boolean): void {
        ctx.patchState({
            profile: {
                ...ctx.getState().profile,
                loading: loading,
            },
        })
    }

    @Action(UpdateCurrentUserTheme)
    public updateCurrentUserTheme(
        ctx: StateContext<RegistryStoreModel>,
        payload: UpdateCurrentUserTheme,
    ): Observable<void> {
        return this.preferencesApi.updateTheme(CurrentUserHelper.mapThemeToString(payload.theme)).pipe(
            map((preferences: PreferencesModel): void => this.updateCurrentUserThemeComplete(ctx, preferences)),
        )
    }

    private updateCurrentUserThemeComplete(
        ctx: StateContext<RegistryStoreModel>,
        preferences: PreferencesModel,
    ): void {
        ctx.patchState({
            authentication: {
                ...ctx.getState().authentication,
                currentUser: {
                    ...ctx.getState().authentication.currentUser!,
                    preferences: {
                        ...ctx.getState().authentication.currentUser!.preferences,
                        theme: preferences.theme,
                    },
                },
            },
        })
    }

    @Action(UpdateCurrentUserLanguage)
    public updateCurrentUserLanguage(
        _: StateContext<RegistryStoreModel>,
        payload: UpdateCurrentUserLanguage,
    ): Observable<PreferencesModel> {
        return this.preferencesApi.updateLanguage(payload.language)
    }

    @Action(ManageUserProjectInvitationAcceptance)
    public manageProjectInvitationAcceptance(
        ctx: StateContext<RegistryStoreModel>,
        payload: ManageUserProjectInvitationAcceptance,
    ): Observable<void> {
        return this.userProjectProfileApi.manageUserProjectProfileAcceptance(
            payload.profileId,
            payload.accepted,
        ).pipe(
            initialize((): void => this.registryFacade.startProfileLoader()),
            finalize((): void => this.registryFacade.stopProfileLoader()),
            map((profile: ProjectProfileModel): void => this.manageProjectInvitationAcceptanceComplete(
                ctx,
                profile,
            )),
        )
    }

    private manageProjectInvitationAcceptanceComplete(
        ctx: StateContext<RegistryStoreModel>,
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `project-profiles.notifications.acceptance.${profile.status.value}.title`,
            `project-profiles.notifications.acceptance.${profile.status.value}.message`,
            'pi pi-user',
        )

        this.registryFacade.fetchCurrentUser()
        this.refreshProfilesPage(ctx)
        this.refreshInvitationsPage(ctx)
    }

    @Action(SetCurrentProject, {cancelUncompleted: true})
    public setCurrentProject(
        ctx: StateContext<RegistryStoreModel>,
        payload: SetCurrentProject,
    ): Observable<void> {
        ctx.patchState({currentProject: {id: payload.projectId, profile: undefined}})

        if (GenericHelper.isNull(payload.projectId)) {
            return of(undefined)
        }

        return this.userProjectProfileApi.findUserProjectProfileByProjectId(payload.projectId!).pipe(
            initialize((): void => this.registryFacade.startGlobalLoader()),
            finalize((): void => this.registryFacade.stopGlobalLoader()),
            map((profile: ProjectProfileModel): void => {
                ctx.patchState({currentProject: {id: payload.projectId, profile}})
            }),
            catchError((error: ErrorModel): Observable<void> => this.globalError(ctx, error)),
        )
    }

    @Action(DeleteUserProjectProfile)
    public deleteUserProjectProfile(
        ctx: StateContext<RegistryStoreModel>,
        payload: DeleteUserProjectProfile,
    ): Observable<void> {
        return this.userProjectProfileApi.deleteUserProfileById(payload.profile.id).pipe(
            initialize((): void => this.registryFacade.startProfileLoader()),
            finalize((): void => this.registryFacade.stopProfileLoader()),
            map((): void => this.deleteUserProjectProfileComplete(ctx, payload.profile)),
        )
    }

    private deleteUserProjectProfileComplete(
        ctx: StateContext<RegistryStoreModel>,
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'project-profiles.notifications.delete.title',
            'project-profiles.notifications.delete.message.myself',
            'pi pi-user',
            {name: profile.project.name},
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshProfilesPage(ctx)
    }

    @Action(CreateSupportProjectProfile)
    public createSupportProjectProfile(
        _: StateContext<RegistryStoreModel>,
        payload: CreateSupportProjectProfile,
    ): Observable<void> {
        return this.userProjectProfileApi.createSupportProjectProfile(payload.projectId).pipe(
            map((profile: ProjectProfileModel): void => this.createSupportProjectProfileComplete(profile)),
        )
    }

    private createSupportProjectProfileComplete(
        profile: ProjectProfileModel,
    ): void {
        this.registryFacade.fetchCurrentUser()

        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.create-support.title',
            'projects.notifications.create-support.message',
            'pi pi-user-plus',
            {
                name: profile?.project?.name,
                end: this.datePipe.transform(profile?.endAccess),
            },
        )
    }


    private globalError(_: StateContext<RegistryStoreModel>, error: ErrorModel): Observable<void> {
        this.registryFacade.setGlobalError(error)
        return of()
    }

    protected refreshProfilesPage(ctx: StateContext<RegistryStoreModel>): void {
        const page: PageModel<ProjectProfileModel> | undefined = ctx.getState().profiles.element
        this.registryFacade.fetchProjectProfilesPage(page?.pageNumber, page?.pageSize, true)
    }

    protected refreshInvitationsPage(ctx: StateContext<RegistryStoreModel>): void {
        const page: PageModel<ProjectProfileModel> | undefined = ctx.getState().invitations.element
        this.registryFacade.fetchProjectProfileInvitationPage(page?.pageNumber, page?.pageSize, true)
    }
}
