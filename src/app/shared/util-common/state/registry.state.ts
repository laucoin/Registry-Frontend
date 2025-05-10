import { Injectable } from '@angular/core'
import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, mergeMap, Observable, of } from 'rxjs'
import { SecurityService } from '../../util-authentication/service/security.service'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { ProjectProfileModel } from '../../util-model/model/project-profile.model'
import { PageModel } from '../../util-model/model/page.model'
import { GenericState } from '../../util-tool/state/generic.state'
import { REDIRECT_URI, TOKEN } from '../../util-tool/util/request.util'
import { initialize } from '../../util-tool/util/rx.util'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { RegistryStateModel } from '../model/registry-state.model'
import {
    AckNotification,
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
    Notify,
    RestoreSessionFromStorage,
    SelectUserProjectProfile,
    SelectUserProjectProfileByProject,
    SetGlobalError,
    StartCurrentUserActionLoader,
    StartGlobalLoader,
    StartUserProjectProfileInvitationsPageLoader,
    StartUserProjectProfileLoader,
    StartUserProjectProfilesPageLoader,
    StopCurrentUserActionLoader,
    StopGlobalLoader,
    StopUserProjectProfileInvitationsPageLoader,
    StopUserProjectProfileLoader,
    StopUserProjectProfilesPageLoader,
    UpdateNetwork,
    UpdateScreenWidth,
    UpdateTheme,
    UpdateUserProjectProfileInvitationsPageSearchParams,
    UpdateUserProjectProfilesPageSearchParams,
} from './registry.action'
import { UserProjectProfileService } from './user-project-profile.service'
import { PreferencesService } from './preferences.service'
import { ProjectModel } from '../../util-model/model/project.model'
import { TokenModel } from '../../util-authentication/model/token.model'
import { AppRouteEnum } from '../../../app-route.enum'
import { AuthenticationUriModel } from '../../util-model/model/authentication-uri.model'
import { Router } from '@angular/router'
import { ErrorModel } from '../../util-model/model/error.model'
import { UserService } from '../../../domains/user/data/state/user.service'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { CustomDateFormatPipe } from '../../util-tool/pipe/custom-date-format.pipe'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { ThemeEnum } from '../../util-model/enumeration/theme.enum'
import { AppConfig } from '../../../app.config'

const defaultRegistryState: RegistryStateModel = {
    authentication: {
        token: undefined,
        currentUser: undefined,
        loading: false,
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
    _util: {
        theme: (!window.matchMedia || window.matchMedia( '(prefers-color-scheme: light)' ).matches) ? ThemeEnum.LIGHT : ThemeEnum.DARK,
        screenWidth: window.innerWidth,
        online: undefined,
        notification: undefined,
        loading: false,
        error: undefined,
    },
    _metadata: {
        themes: [
            {
                icon: 'pi pi-desktop',
                value: ThemeEnum.SYSTEM,
            },
            {
                icon: 'pi pi-sun',
                value: ThemeEnum.LIGHT,
            },
            {
                icon: 'pi pi-moon',
                value: ThemeEnum.DARK,
            },
        ],
        languages: [],
    },
}

@State<RegistryStateModel>( {
    name: 'registry',
    defaults: defaultRegistryState,
} )
@Injectable()
export class RegistryState extends GenericState implements NgxsOnInit {
    private readonly darkModeClass: string = 'dark-mod'
    private readonly htmlElement: HTMLHtmlElement = document.querySelector( 'html' ) as HTMLHtmlElement

    public constructor (
        private readonly service: SecurityService,
        private readonly userProjectProfileService: UserProjectProfileService,
        private readonly preferencesService: PreferencesService,
        private readonly userService: UserService,
        private readonly router: Router,
        private readonly datePipe: CustomDateFormatPipe,
    ) { super() }

    public ngxsOnInit (ctx: StateContext<RegistryStateModel>): void {
        ctx.patchState( {
            _metadata: {
                themes: defaultRegistryState._metadata.themes,
                languages: AppConfig.config.languages.map( (lang: string): SelectItem<string> => ({
                    label: 'global.language.' + lang,
                    value: lang,
                }) ),
            },
        } )
    }

    @Selector()
    public static globalLoading (state: RegistryStateModel): boolean {
        return state._util.loading
    }

    @Selector()
    public static currentUserActionLoading (state: RegistryStateModel): boolean {
        return state.authentication.loading
    }

    @Selector()
    public static globalError (state: RegistryStateModel): ToastMessageOptions | undefined {
        return state._util.error
    }

    @Selector()
    public static online (state: RegistryStateModel): boolean | undefined {
        return state._util.online
    }

    @Selector()
    public static screenWidth (state: RegistryStateModel): number {
        return state._util.screenWidth
    }

    @Selector()
    public static theme (state: RegistryStateModel): ThemeEnum {
        return state._util.theme
    }

    @Selector()
    public static notification (state: RegistryStateModel): ToastMessageOptions | undefined {
        return state._util.notification
    }

    @Selector()
    public static tokens (state: RegistryStateModel): TokenModel | undefined {
        return state.authentication.token
    }

    @Selector()
    public static currentUser (state: RegistryStateModel): CurrentUserModel | undefined {
        return state.authentication.currentUser
    }

    @Selector()
    public static currentUserSelectedProject (state: RegistryStateModel): ProjectModel | undefined {
        return state.authentication.currentUser?.preferences?.selectedProfile?.project
    }

    @Selector()
    public static currentUserSelectedProjectId (state: RegistryStateModel): string | undefined {
        return state.authentication.currentUser?.preferences?.selectedProfile?.project?.id
    }

    @Selector()
    public static userProjectProfilesPage (state: RegistryStateModel): PageModel<ProjectProfileModel> | undefined {
        return state.profiles.element
    }

    @Selector()
    public static userProjectProfilesPageLoading (state: RegistryStateModel): boolean {
        return state.profiles.loading
    }

    @Selector()
    public static userProjectProfilesPageError (state: RegistryStateModel): ToastMessageOptions | undefined {
        return state.profiles.error
    }

    @Selector()
    public static userProjectProfilesPageSilentLoading (state: RegistryStateModel): boolean {
        return state.profiles.silentLoading
    }

    @Selector()
    public static userProjectProfilesPageResetSearch (state: RegistryStateModel): boolean {
        return state.profiles.params.resetSearch
    }

    @Selector()
    public static userProjectProfilesPageTextSearchParam (state: RegistryStateModel): string | undefined {
        return state.profiles.params.textSearched
    }

    @Selector()
    public static userProjectProfilesPageDateTimeSearchParam (state: RegistryStateModel): string | undefined {
        return state.profiles.params.dateTimeSearched
    }

    @Selector()
    public static userProjectProfilesPageAvailabilitySearchParam (state: RegistryStateModel): boolean | undefined {
        return state.profiles.params.availabilitySearched
    }

    @Selector()
    public static userProjectProfileInvitationsPage (state: RegistryStateModel): PageModel<ProjectProfileModel> | undefined {
        return state.invitations.element
    }

    @Selector()
    public static userProjectProfileInvitationsPageLoading (state: RegistryStateModel): boolean {
        return state.invitations.loading
    }

    @Selector()
    public static userProjectProfileInvitationsPageError (state: RegistryStateModel): ToastMessageOptions | undefined {
        return state.invitations.error
    }

    @Selector()
    public static userProjectProfileInvitationsPageSilentLoading (state: RegistryStateModel): boolean {
        return state.invitations.silentLoading
    }

    @Selector()
    public static userProjectProfileInvitationsPageResetSearch (state: RegistryStateModel): boolean {
        return state.invitations.params.resetSearch
    }

    @Selector()
    public static userProjectProfileInvitationsPageTextSearchParam (state: RegistryStateModel): string | undefined {
        return state.invitations.params.textSearched
    }

    @Selector()
    public static userProjectProfileInvitationsPageDateTimeParam (state: RegistryStateModel): string | undefined {
        return state.invitations.params.dateTimeSearched
    }

    @Selector()
    public static themesMetadata (state: RegistryStateModel): SelectItem<ThemeEnum>[] {
        return state._metadata.themes
    }

    @Selector()
    public static languagesMetadata (state: RegistryStateModel): SelectItem<string>[] {
        return state._metadata.languages
    }

    @Action( StartGlobalLoader )
    public startGlobalLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateGlobalLoader( ctx, true )
    }

    @Action( StopGlobalLoader )
    public stopGlobalLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateGlobalLoader( ctx, false )
    }

    @Action( SetGlobalError )
    public setGlobalError (ctx: StateContext<RegistryStateModel>, payload: SetGlobalError): void {
        this.globalError( ctx, payload.error )
    }

    @Action( UpdateNetwork )
    public updateNetwork (ctx: StateContext<RegistryStateModel>, payload: UpdateNetwork): void {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                online: payload.online,
            },
        } )
    }

    @Action( UpdateScreenWidth )
    public updateScreenWidth (ctx: StateContext<RegistryStateModel>, payload: UpdateScreenWidth): void {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                screenWidth: payload.screenWidth,
            },
        } )
    }

    @Action( UpdateTheme )
    public updateTheme (ctx: StateContext<RegistryStateModel>, payload: UpdateTheme): void {
        if (payload.theme == ThemeEnum.LIGHT) {
            this.htmlElement?.classList.remove( this.darkModeClass )
        } else {
            this.htmlElement?.classList.add( this.darkModeClass )
        }

        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                theme: payload.theme,
            },
        } )
    }

    @Action( Notify )
    public notify (ctx: StateContext<RegistryStateModel>, payload: Notify): void {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                notification: payload.message,
            },
        } )
    }

    @Action( AckNotification )
    public ackNotification (ctx: StateContext<RegistryStateModel>): void {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                notification: undefined,
            },
        } )
    }

    @Action( StartCurrentUserActionLoader )
    public startCurrentUserActionLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateCurrentUserActionLoader( ctx, true )
    }

    @Action( StopCurrentUserActionLoader )
    public stopCurrentUserActionLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateCurrentUserActionLoader( ctx, false )
    }

    private updateCurrentUserActionLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            authentication: {
                ...ctx.getState().authentication,
                loading: loading,
            },
        } )
    }

    @Action( Login )
    public login (ctx: StateContext<RegistryStateModel>): Observable<void> {
        ctx.setState( defaultRegistryState )
        return this.service.getLoginUri( `${location.origin}/${AppRouteEnum.AUTH_CALLBACK}` ).pipe(
            initialize( (): void => this.registryFacade.startGlobalLoader() ),
            finalize( (): void => this.registryFacade.stopGlobalLoader() ),
            map( (uri: AuthenticationUriModel): void => { window.location.href = uri.uri } ),
            catchError( (error: ErrorModel): Observable<void> => this.globalError( ctx, error ) ),
        )
    }

    @Action( Logout )
    public logout (ctx: StateContext<RegistryStateModel>): Observable<void> {
        SessionStorageUtils.delete( TOKEN )
        return this.service.getLogoutUri( location.origin ).pipe(
            initialize( (): void => this.registryFacade.startGlobalLoader() ),
            finalize( (): void => this.registryFacade.stopGlobalLoader() ),
            map( (uri: AuthenticationUriModel): void => { window.location.href = uri.uri } ),
            catchError( (error: ErrorModel): Observable<void> => this.globalError( ctx, error ) ),
        )
    }

    @Action( RestoreSessionFromStorage )
    public restoreTokens (ctx: StateContext<RegistryStateModel>, payload: RestoreSessionFromStorage): void {
        ctx.patchState( {
            authentication: {
                ...ctx.getState().authentication,
                token: payload.token,
            },
        } )
    }

    @Action( FetchTokens )
    public fetchTokens (ctx: StateContext<RegistryStateModel>, payload: FetchTokens): Observable<void> {
        return this.service.fetchToken( {
            authorizationCode: payload.authorizationCode,
            redirectUri: `${location.origin}/${AppRouteEnum.AUTH_CALLBACK}`,
        } ).pipe(
            initialize( (): void => this.registryFacade.startGlobalLoader() ),
            finalize( (): void => this.registryFacade.stopGlobalLoader() ),
            map( (token: TokenModel): void => this.fetchTokensComplete( ctx, token ) ),
            mergeMap( (): Observable<CurrentUserModel> => this.service.fetchCurrentUser() ),
            map( (currentUser: CurrentUserModel): void => this.fetchCurrentUserComplete( ctx, currentUser ) ),
            map( (): void => {
                const redirectUri: string = (SessionStorageUtils.get( REDIRECT_URI ) as string | undefined) ?? AppRouteEnum.PROJECTS
                this.router.navigateByUrl( !redirectUri.includes( AppRouteEnum.AUTH_CALLBACK ) ? redirectUri : AppRouteEnum.PROJECTS )
                    .then( (): void => SessionStorageUtils.delete( REDIRECT_URI ) )
            } ),
            catchError( (error: ErrorModel): Observable<void> => this.globalError( ctx, error ) ),
        )
    }

    private fetchTokensComplete (ctx: StateContext<RegistryStateModel>, token: TokenModel): void {
        SessionStorageUtils.set( TOKEN, token )
        ctx.patchState( {
            authentication: {
                ...ctx.getState().authentication,
                token: token,
            },
        } )
    }

    @Action( FetchCurrentUser )
    public fetchCurrentUser (ctx: StateContext<RegistryStateModel>): Observable<void> {
        return this.service.fetchCurrentUser().pipe(
            initialize( (): void => this.registryFacade.startGlobalLoader() ),
            finalize( (): void => this.registryFacade.stopGlobalLoader() ),
            map( (currentUser: CurrentUserModel): void => this.fetchCurrentUserComplete( ctx, currentUser ) ),
            catchError( (error: ErrorModel): Observable<void> => this.globalError( ctx, error ) ),
        )
    }

    private fetchCurrentUserComplete (ctx: StateContext<RegistryStateModel>, currentUser: CurrentUserModel): void {
        ctx.patchState( {
            authentication: {
                ...ctx.getState().authentication,
                currentUser: currentUser,
            },
        } )
    }

    @Action( ImpersonateCurrentUser )
    public impersonateCurrentUser (): Observable<void> {
        return this.userService.impersonateCurrentUser().pipe(
            initialize( (): void => this.registryFacade.startCurrentUserActionLoader() ),
            finalize( (): void => this.registryFacade.stopCurrentUserActionLoader() ),
            map( (): void => this.registryFacade.logout() ),
        )
    }

    @Action( StartUserProjectProfilesPageLoader )
    public startUserProjectProfilesPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserProjectProfilesLoader( ctx, true )
    }

    @Action( StopUserProjectProfilesPageLoader )
    public stopUserProjectProfilesPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserProjectProfilesLoader( ctx, false )
    }

    private updateUserProjectProfilesLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles, loading: loading,
            },
        } )
    }

    @Action( FetchUserProjectProfilesPage )
    public fetchUserProjectProfilesPage (
        ctx: StateContext<RegistryStateModel>,
        payload: FetchUserProjectProfilesPage,
    ): Observable<void> {
        return this.userProjectProfileService.findUserProjectProfiles(
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().profiles.params,
        ).pipe(
            initialize( (): void => this.registryFacade.startProfilesPageLoader() ),
            finalize( (): void => this.registryFacade.stopProfilesPageLoader() ),
            map( (profilePage: PageModel<ProjectProfileModel>): void => this.fetchUserProjectProfilesPageComplete(
                ctx,
                profilePage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchUserProjectProfilesPageError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchUserProjectProfilesPageComplete (
        ctx: StateContext<RegistryStateModel>,
        profilePage: PageModel<ProjectProfileModel>,
    ): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles,
                params: {
                    ...ctx.getState().profiles.params,
                    resetSearch: false,
                },
                element: profilePage,
            },
        } )
    }

    private fetchUserProjectProfilesPageError (
        ctx: StateContext<RegistryStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status === 503) {
            throw error
        } else {
            ctx.patchState( {
                profiles: this.buildErrorMessage( ctx.getState().profiles, error ),
            } )
        }

        return of()
    }

    @Action( UpdateUserProjectProfilesPageSearchParams )
    public updateUserProjectProfilesPageSearchParams (
        ctx: StateContext<RegistryStateModel>,
        payload: UpdateUserProjectProfilesPageSearchParams,
    ): void {
        ctx.patchState( {
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
        } )
    }

    @Action( StartUserProjectProfileInvitationsPageLoader )
    public startUserProjectProfileInvitationsPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserProjectProfileInvitationsLoader( ctx, true )
    }

    @Action( StopUserProjectProfileInvitationsPageLoader )
    public stopUserProjectProfileInvitationsPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserProjectProfileInvitationsLoader( ctx, false )
    }

    private updateUserProjectProfileInvitationsLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                loading: loading,
            },
        } )
    }

    @Action( FetchUserProjectProfileInvitationsPage )
    public fetchUserProjectProfileInvitationsPage (
        ctx: StateContext<RegistryStateModel>,
        payload: FetchUserProjectProfileInvitationsPage,
    ): Observable<void> {
        return this.userProjectProfileService.findUserProjectProfiles(
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().invitations.params,
        ).pipe(
            initialize( (): void => this.registryFacade.startInvitationsPageLoader() ),
            finalize( (): void => this.registryFacade.stopInvitationsPageLoader() ),
            map( (invitationPage: PageModel<ProjectProfileModel>): void => this.fetchUserProjectProfileInvitationsPageComplete(
                ctx,
                invitationPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchUserProjectProfileInvitationsPageError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchUserProjectProfileInvitationsPageComplete (
        ctx: StateContext<RegistryStateModel>,
        invitationPage: PageModel<ProjectProfileModel>,
    ): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                params: {
                    ...ctx.getState().invitations.params,
                    resetSearch: false,
                },
                element: invitationPage,
            },
        } )
    }

    private fetchUserProjectProfileInvitationsPageError (
        ctx: StateContext<RegistryStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status === 503) {
            throw error
        } else {
            ctx.patchState( {
                invitations: this.buildErrorMessage( ctx.getState().invitations, error ),
            } )
        }

        return of()
    }

    @Action( UpdateUserProjectProfileInvitationsPageSearchParams )
    public updateUserProjectProfileInvitationsPageSearchParams (
        ctx: StateContext<RegistryStateModel>,
        payload: UpdateUserProjectProfileInvitationsPageSearchParams,
    ): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                params: {
                    ...ctx.getState().invitations.params,
                    resetSearch: payload.resetSearch,
                    textSearched: payload.textSearched,
                    dateTimeSearched: payload.dateTimeSearched,
                },
            },
        } )
    }

    @Action( StartUserProjectProfileLoader )
    public startUserProjectProfileLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserProjectProfileLoader( ctx, true )
    }

    @Action( StopUserProjectProfileLoader )
    public stopUserProjectProfileLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserProjectProfileLoader( ctx, false )
    }

    private updateUserProjectProfileLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            profile: {
                ...ctx.getState().profile,
                loading: loading,
            },
        } )
    }

    @Action( ManageUserProjectInvitationAcceptance )
    public manageProjectInvitationAcceptance (
        ctx: StateContext<RegistryStateModel>,
        payload: ManageUserProjectInvitationAcceptance,
    ): Observable<void> {
        return this.userProjectProfileService.manageUserProjectProfileAcceptance(
            payload.profileId,
            payload.accepted,
        ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (profile: ProjectProfileModel): void => this.manageProjectInvitationAcceptanceComplete(
                ctx,
                profile,
            ) ),
        )
    }

    private manageProjectInvitationAcceptanceComplete (
        ctx: StateContext<RegistryStateModel>,
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `project-profiles.notifications.acceptance.${profile.status.value}.title`,
            `project-profiles.notifications.acceptance.${profile.status.value}.message`,
            'pi pi-user',
        )

        this.registryFacade.fetchCurrentUser()
        this.refreshProfilesPage( ctx )
        this.refreshInvitationsPage( ctx )
    }

    @Action( SelectUserProjectProfile )
    public selectProjectProfile (
        _: StateContext<RegistryStateModel>,
        payload: SelectUserProjectProfile,
    ): Observable<void> {
        return this.preferencesService.selectUserProjectProfile( payload.profileId ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (): void => this.selectProjectProfileComplete() ),
        )
    }

    private selectProjectProfileComplete (): void {
        this.registryFacade.fetchCurrentUser()
    }

    @Action( SelectUserProjectProfileByProject )
    public selectUserProjectProfileByProject (
        _: StateContext<RegistryStateModel>,
        payload: SelectUserProjectProfileByProject,
    ): Observable<void> {
        return this.preferencesService.selectUserProjectProfileByProjectId( payload.projectId ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (): void => this.selectUserProjectProfileByProjectComplete() ),
        )
    }

    private selectUserProjectProfileByProjectComplete (): void {
        this.registryFacade.fetchCurrentUser()
    }

    @Action( DeleteUserProjectProfile )
    public deleteUserProjectProfile (
        ctx: StateContext<RegistryStateModel>,
        payload: DeleteUserProjectProfile,
    ): Observable<void> {
        return this.userProjectProfileService.deleteUserProfileById( payload.profile.id ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (): void => this.deleteUserProjectProfileComplete( ctx, payload.profile ) ),
        )
    }

    private deleteUserProjectProfileComplete (
        ctx: StateContext<RegistryStateModel>,
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'project-profiles.notifications.delete.title',
            'project-profiles.notifications.delete.message.myself',
            'pi pi-user',
            { name: profile.project.name },
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshProfilesPage( ctx )
    }

    @Action( CreateSupportProjectProfile )
    public createSupportProjectProfile (
        _: StateContext<RegistryStateModel>,
        payload: CreateSupportProjectProfile,
    ): Observable<void> {
        return this.userProjectProfileService.createSupportProjectProfile( payload.projectId ).pipe(
            map( (profile: ProjectProfileModel): void => this.createSupportProjectProfileComplete( profile ) ),
        )
    }

    private createSupportProjectProfileComplete (
        profile: ProjectProfileModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'projects.notifications.create-support.title',
            'projects.notifications.create-support.message',
            'pi pi-user-plus',
            {
                name: profile?.project?.name,
                end: this.datePipe.transform( profile?.endAccess ),
            },
        )
    }

    private updateGlobalLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                loading: loading,
            },
        } )
    }

    private globalError (ctx: StateContext<RegistryStateModel>, error: ErrorModel): Observable<void> {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                error: {
                    severity: 'error',
                    summary: error.title,
                    detail: error.message,
                    icon: 'pi pi-exclamation-triangle',
                    closable: true,
                },
            },
        } )

        return of()
    }

    protected refreshProfilesPage (ctx: StateContext<RegistryStateModel>): void {
        const page: PageModel<ProjectProfileModel> | undefined = ctx.getState().profiles.element
        this.registryFacade.fetchProjectProfilesPage( page?.pageNumber, page?.pageSize, true )
    }

    protected refreshInvitationsPage (ctx: StateContext<RegistryStateModel>): void {
        const page: PageModel<ProjectProfileModel> | undefined = ctx.getState().invitations.element
        this.registryFacade.fetchProjectProfileInvitationPage( page?.pageNumber, page?.pageSize, true )
    }
}
