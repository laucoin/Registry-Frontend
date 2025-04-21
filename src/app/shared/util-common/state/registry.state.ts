import { Injectable } from '@angular/core'
import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, mergeMap, Observable, of } from 'rxjs'
import { SecurityService } from '../../util-authentication/service/security.service'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageModel } from '../../util-model/model/page.model'
import { GenericState } from '../../util-tool/state/generic.state'
import { REDIRECT_URI, TOKEN } from '../../util-tool/util/request.util'
import { initialize } from '../../util-tool/util/rx.util'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { RegistryStateModel } from '../model/registry-state.model'
import {
    AckNotification,
    CreateSupportEventProfile,
    DeleteUserEventProfile,
    FetchCurrentUser,
    FetchTokens,
    FetchUserEventProfileInvitationsPage,
    FetchUserEventProfilesPage,
    ImpersonateCurrentUser,
    Login,
    Logout,
    ManageUserEventInvitationAcceptance,
    Notify,
    RefreshTokens,
    RestoreTokens,
    SelectUserEventProfile,
    SelectUserEventProfileByEvent,
    SetGlobalError,
    StartGlobalLoader,
    StartUserEventProfileInvitationsPageLoader,
    StartUserEventProfileLoader,
    StartUserEventProfilesPageLoader,
    StopGlobalLoader,
    StopUserEventProfileInvitationsPageLoader,
    StopUserEventProfileLoader,
    StopUserEventProfilesPageLoader,
    UpdateNetwork,
    UpdateScreenWidth,
    UpdateTheme,
    UpdateUserEventProfileInvitationsPageSearchParams,
    UpdateUserEventProfilesPageSearchParams,
} from './registry.action'
import { UserEventProfileService } from './user-event-profile.service'
import { PreferencesService } from './preferences.service'
import { EventService } from '../../../domains/event/data/state/event.service'
import { EventModel } from '../../util-model/model/event.model'
import { TokenModel } from '../../util-authentication/model/token.model'
import { AppRouteEnum } from '../../../app-route.enum'
import { AuthenticationUriModel } from '../../util-model/model/authentication-uri.model'
import { Router } from '@angular/router'
import { ErrorModel } from '../../util-model/model/error.model'
import { UserService } from '../../../domains/user/data/state/user.service'
import { ToastMessageOptions } from 'primeng/api'
import { CustomDateFormatPipe } from '../../util-tool/pipe/custom-date-format.pipe'

const defaultRegistryState: RegistryStateModel = {
    authentication: {
        token: undefined,
        currentUser: undefined,
    },
    profiles: {
        params: {
            resetSearch: false,
            availabilitySearched: undefined,
            statusSearched: 'ACCEPTED',
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
            statusSearched: 'INVITED',
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
        theme: (!window.matchMedia || window.matchMedia( '(prefers-color-scheme: light)' ).matches) ? 'light' : 'dark',
        screenWidth: window.innerWidth,
        online: undefined,
        notification: undefined,
        loading: false,
        error: undefined,
    },
}

@State<RegistryStateModel>( {
    name: 'registry',
    defaults: defaultRegistryState,
} )
@Injectable()
export class RegistryState extends GenericState {
    private readonly darkModeClass: string = 'dark-mod'
    private readonly htmlElement: HTMLHtmlElement = document.querySelector( 'html' ) as HTMLHtmlElement

    public constructor (
        private readonly service: SecurityService,
        private readonly eventService: EventService,
        private readonly userEventProfileService: UserEventProfileService,
        private readonly preferencesService: PreferencesService,
        private readonly userService: UserService,
        private readonly router: Router,
        private readonly datePipe: CustomDateFormatPipe,
    ) { super() }

    @Selector()
    public static globalLoading (state: RegistryStateModel): boolean {
        return state._util.loading
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
    public static theme (state: RegistryStateModel): 'light' | 'dark' {
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
    public static currentUserSelectedEvent (state: RegistryStateModel): EventModel | undefined {
        return state.authentication.currentUser?.preferences?.selectedProfile?.event
    }

    @Selector()
    public static currentUserSelectedEventId (state: RegistryStateModel): string | undefined {
        return state.authentication.currentUser?.preferences?.selectedProfile?.event?.id
    }

    @Selector()
    public static userEventProfilesPage (state: RegistryStateModel): PageModel<EventProfileModel> | undefined {
        return state.profiles.element
    }

    @Selector()
    public static userEventProfilesPageLoading (state: RegistryStateModel): boolean {
        return state.profiles.loading
    }

    @Selector()
    public static userEventProfilesPageError (state: RegistryStateModel): ToastMessageOptions | undefined {
        return state.profiles.error
    }

    @Selector()
    public static userEventProfilesPageSilentLoading (state: RegistryStateModel): boolean {
        return state.profiles.silentLoading
    }

    @Selector()
    public static userEventProfilesPageResetSearch (state: RegistryStateModel): boolean {
        return state.profiles.params.resetSearch
    }

    @Selector()
    public static userEventProfilesPageTextSearchParam (state: RegistryStateModel): string | undefined {
        return state.profiles.params.textSearched
    }

    @Selector()
    public static userEventProfilesPageDateTimeSearchParam (state: RegistryStateModel): string | undefined {
        return state.profiles.params.dateTimeSearched
    }

    @Selector()
    public static userEventProfileInvitationsPage (state: RegistryStateModel): PageModel<EventProfileModel> | undefined {
        return state.invitations.element
    }

    @Selector()
    public static userEventProfileInvitationsPageLoading (state: RegistryStateModel): boolean {
        return state.invitations.loading
    }

    @Selector()
    public static userEventProfileInvitationsPageError (state: RegistryStateModel): ToastMessageOptions | undefined {
        return state.invitations.error
    }

    @Selector()
    public static userEventProfileInvitationsPageSilentLoading (state: RegistryStateModel): boolean {
        return state.invitations.silentLoading
    }

    @Selector()
    public static userEventProfileInvitationsPageResetSearch (state: RegistryStateModel): boolean {
        return state.invitations.params.resetSearch
    }

    @Selector()
    public static userEventProfileInvitationsPageTextSearchParam (state: RegistryStateModel): string | undefined {
        return state.invitations.params.textSearched
    }

    @Selector()
    public static userEventProfileInvitationsPageDateTimeParam (state: RegistryStateModel): string | undefined {
        return state.invitations.params.dateTimeSearched
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
        if (payload.theme == 'light') {
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

    @Action( Login )
    public login (ctx: StateContext<RegistryStateModel>): Observable<void> {
        SessionStorageUtils.clear()
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

    @Action( RestoreTokens )
    public restoreTokens (ctx: StateContext<RegistryStateModel>, payload: RestoreTokens): void {
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
                const redirectUri: string = SessionStorageUtils.check( REDIRECT_URI ) ?
                                            SessionStorageUtils.get( REDIRECT_URI ) as string
                                                                                      : AppRouteEnum.HOME
                this.router.navigateByUrl( redirectUri ).then( (): void => SessionStorageUtils.delete( REDIRECT_URI ) )
            } ),
            catchError( (error: ErrorModel): Observable<void> => this.globalError( ctx, error ) ),
        )
    }

    @Action( RefreshTokens )
    public refreshTokens (ctx: StateContext<RegistryStateModel>): Observable<void> {
        if (!ctx.getState().authentication.token) return of()
        return this.service.refreshToken( ctx.getState().authentication.token! ).pipe(
            map( (token: TokenModel): void => this.fetchTokensComplete( ctx, token ) ),
            catchError( (error: ErrorModel): Observable<void> => {
                if (error.status === 401) {
                    this.registryFacade.login()
                }
                return this.globalError( ctx, error )
            } ),
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
            initialize( (): void => this.registryFacade.startGlobalLoader() ),
            finalize( (): void => this.registryFacade.stopGlobalLoader() ),
            map( (): void => this.registryFacade.logout() ),
        )
    }

    @Action( StartUserEventProfilesPageLoader )
    public startUserEventProfilesPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserEventProfilesLoader( ctx, true )
    }

    @Action( StopUserEventProfilesPageLoader )
    public stopUserEventProfilesPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserEventProfilesLoader( ctx, false )
    }

    private updateUserEventProfilesLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles, loading: loading,
            },
        } )
    }

    @Action( FetchUserEventProfilesPage )
    public fetchUserEventProfilesPage (
        ctx: StateContext<RegistryStateModel>,
        payload: FetchUserEventProfilesPage,
    ): Observable<void> {
        return this.userEventProfileService.findUserEventProfiles(
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().profiles.params,
        ).pipe(
            initialize( (): void => this.registryFacade.startProfilesPageLoader() ),
            finalize( (): void => this.registryFacade.stopProfilesPageLoader() ),
            map( (profilePage: PageModel<EventProfileModel>): void => this.fetchUserEventProfilesPageComplete(
                ctx,
                profilePage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchUserEventProfilesPageError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchUserEventProfilesPageComplete (
        ctx: StateContext<RegistryStateModel>,
        profilePage: PageModel<EventProfileModel>,
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

    private fetchUserEventProfilesPageError (
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

    @Action( UpdateUserEventProfilesPageSearchParams )
    public updateUserEventProfilesPageSearchParams (
        ctx: StateContext<RegistryStateModel>,
        payload: UpdateUserEventProfilesPageSearchParams,
    ): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles,
                params: {
                    ...ctx.getState().invitations.params,
                    resetSearch: payload.resetSearch,
                    textSearched: payload.textSearched,
                    dateTimeSearched: payload.dateTimeSearched,
                },
            },
        } )
    }

    @Action( StartUserEventProfileInvitationsPageLoader )
    public startUserEventProfileInvitationsPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserEventProfileInvitationsLoader( ctx, true )
    }

    @Action( StopUserEventProfileInvitationsPageLoader )
    public stopUserEventProfileInvitationsPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserEventProfileInvitationsLoader( ctx, false )
    }

    private updateUserEventProfileInvitationsLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                loading: loading,
            },
        } )
    }

    @Action( FetchUserEventProfileInvitationsPage )
    public fetchUserEventProfileInvitationsPage (
        ctx: StateContext<RegistryStateModel>,
        payload: FetchUserEventProfileInvitationsPage,
    ): Observable<void> {
        return this.userEventProfileService.findUserEventProfiles(
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().invitations.params,
        ).pipe(
            initialize( (): void => this.registryFacade.startInvitationsPageLoader() ),
            finalize( (): void => this.registryFacade.stopInvitationsPageLoader() ),
            map( (invitationPage: PageModel<EventProfileModel>): void => this.fetchUserEventProfileInvitationsPageComplete(
                ctx,
                invitationPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchUserEventProfileInvitationsPageError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchUserEventProfileInvitationsPageComplete (
        ctx: StateContext<RegistryStateModel>,
        invitationPage: PageModel<EventProfileModel>,
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

    private fetchUserEventProfileInvitationsPageError (
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

    @Action( UpdateUserEventProfileInvitationsPageSearchParams )
    public updateUserEventProfileInvitationsPageSearchParams (
        ctx: StateContext<RegistryStateModel>,
        payload: UpdateUserEventProfileInvitationsPageSearchParams,
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

    @Action( StartUserEventProfileLoader )
    public startUserEventProfileLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserEventProfileLoader( ctx, true )
    }

    @Action( StopUserEventProfileLoader )
    public stopUserEventProfileLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateUserEventProfileLoader( ctx, false )
    }

    private updateUserEventProfileLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            profile: {
                ...ctx.getState().profile,
                loading: loading,
            },
        } )
    }

    @Action( ManageUserEventInvitationAcceptance )
    public manageEventInvitationAcceptance (
        ctx: StateContext<RegistryStateModel>,
        payload: ManageUserEventInvitationAcceptance,
    ): Observable<void> {
        return this.userEventProfileService.manageUserEventProfileAcceptance(
            payload.profileId,
            payload.accepted,
        ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (profile: EventProfileModel): void => this.manageEventInvitationAcceptanceComplete( ctx, profile ) ),
        )
    }

    private manageEventInvitationAcceptanceComplete (
        ctx: StateContext<RegistryStateModel>,
        profile: EventProfileModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            `event-profiles.notifications.acceptance.${profile.status.value}.title`,
            `event-profiles.notifications.acceptance.${profile.status.value}.message`,
            'pi pi-user',
        )

        this.registryFacade.fetchCurrentUser()
        this.refreshProfilesPage( ctx )
        this.refreshInvitationsPage( ctx )
    }

    @Action( SelectUserEventProfile )
    public selectEventProfile (
        _: StateContext<RegistryStateModel>,
        payload: SelectUserEventProfile,
    ): Observable<void> {
        return this.preferencesService.selectUserEventProfile( payload.profile.id ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (): void => this.selectEventProfileComplete( payload.profile ) ),
        )
    }

    private selectEventProfileComplete (profile: EventProfileModel): void {
        this.buildMessageAndNotify(
            'success',
            'event-profiles.notifications.select.title',
            'event-profiles.notifications.select.message',
            'pi pi-verified',
            { name: profile.event.name },
        )

        this.registryFacade.fetchCurrentUser()
    }

    @Action( SelectUserEventProfileByEvent )
    public selectUserEventProfileByEvent (
        _: StateContext<RegistryStateModel>,
        payload: SelectUserEventProfileByEvent,
    ): Observable<void> {
        return this.preferencesService.selectUserEventProfileByEventId( payload.event.id ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (): void => this.selectUserEventProfileByEventComplete( payload.event ) ),
        )
    }

    private selectUserEventProfileByEventComplete (event: EventModel): void {
        this.buildMessageAndNotify(
            'success',
            'events.notifications.select.title',
            'events.notifications.select.message',
            'pi pi-verified',
            { name: event.name },
        )

        this.registryFacade.fetchCurrentUser()
    }

    @Action( DeleteUserEventProfile )
    public deleteUserEventProfile (
        ctx: StateContext<RegistryStateModel>,
        payload: DeleteUserEventProfile,
    ): Observable<void> {
        return this.userEventProfileService.deleteUserProfileById( payload.profile.id ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (): void => this.deleteUserEventProfileComplete( ctx, payload.profile ) ),
        )
    }

    private deleteUserEventProfileComplete (ctx: StateContext<RegistryStateModel>, profile: EventProfileModel): void {
        this.buildMessageAndNotify(
            'success',
            'event-profiles.notifications.delete.title',
            'event-profiles.notifications.delete.message.myself',
            'pi pi-user',
            { name: profile.event.name },
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshProfilesPage( ctx )
    }

    @Action( CreateSupportEventProfile )
    public createSupportEventProfile (
        _: StateContext<RegistryStateModel>,
        payload: CreateSupportEventProfile,
    ): Observable<void> {
        return this.userEventProfileService.createSupportEventProfile( payload.eventId ).pipe(
            map( (profile: EventProfileModel): void => this.createSupportEventProfileComplete( profile ) ),
        )
    }

    private createSupportEventProfileComplete (
        profile: EventProfileModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'events.notifications.create-support.title',
            'events.notifications.create-support.message',
            'pi pi-user-plus',
            {
                name: profile?.event?.name,
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
        const page: PageModel<EventProfileModel> | undefined = ctx.getState().profiles.element
        this.registryFacade.fetchEventProfilePage( page?.pageNumber, page?.pageSize, true )
    }

    protected refreshInvitationsPage (ctx: StateContext<RegistryStateModel>): void {
        const page: PageModel<EventProfileModel> | undefined = ctx.getState().invitations.element
        this.registryFacade.fetchEventProfileInvitationPage( page?.pageNumber, page?.pageSize, true )
    }
}
