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
    DeleteUserEventProfile,
    FetchContextEvent,
    FetchCurrentUser,
    FetchTokens,
    FetchUserEventProfileInvitationsPage,
    FetchUserEventProfilesPage,
    ImpersonateCurrentUser,
    InputUserEventProfileInvitationsPageDateRange,
    InputUserEventProfileInvitationsPageSearch,
    InputUserEventProfilesPageDateRange,
    InputUserEventProfilesPageSearch,
    Login,
    Logout,
    ManageUserEventInvitationAcceptance,
    Notify,
    RefreshTokens,
    RestoreTokens,
    SelectUserEventProfile,
    SelectUserEventProfileInvitationsPageOrder,
    SelectUserEventProfilesPageOrder,
    SetGlobalError,
    StartContextEventLoader,
    StartGlobalLoader,
    StartUserEventProfileInvitationsPageLoader,
    StartUserEventProfileLoader,
    StartUserEventProfilesPageLoader,
    StopContextEventLoader,
    StopGlobalLoader,
    StopUserEventProfileInvitationsPageLoader,
    StopUserEventProfileLoader,
    StopUserEventProfilesPageLoader,
    UpdateNetwork,
    UpdateTheme,
} from './registry.action'
import { UserEventProfileService } from './user-event-profile.service'
import { OrderEnum } from '../../util-model/enumeration/order.enum'
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

const defaultRegistryState: RegistryStateModel = {
    authentication: {
        token: undefined,
        currentUser: undefined,
    },
    profiles: {
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            onlyUsable: true,
            status: 'ACCEPTED',
            searched: undefined,
            startAccess: undefined,
            endAccess: undefined,
        },
        element: undefined,
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    invitations: {
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            onlyUsable: false,
            status: 'INVITED',
            searched: undefined,
            startAccess: undefined,
            endAccess: undefined,
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
    event: {
        element: undefined,
        loading: false,
    },
    _util: {
        theme: (!window.matchMedia || window.matchMedia( '(prefers-color-scheme: light)' ).matches) ? 'light' : 'dark',
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
    public static contextEventLoading (state: RegistryStateModel): boolean {
        return state.event.loading
    }

    @Selector()
    public static contextEvent (state: RegistryStateModel): EventModel | undefined {
        return state.event.element
    }

    @Selector()
    public static contextEventId (state: RegistryStateModel): string | undefined {
        return state.event.element?.id
    }

    @Selector()
    public static currentUser (state: RegistryStateModel): CurrentUserModel | undefined {
        return state.authentication.currentUser
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
    public static userEventProfilesPageSearchParam (state: RegistryStateModel): string | undefined {
        return state.profiles.params.searched
    }

    @Selector()
    public static userEventProfilesPageStartAccessParam (state: RegistryStateModel): string | undefined {
        return state.profiles.params.startAccess
    }

    @Selector()
    public static userEventProfilesPageEndAccessParam (state: RegistryStateModel): string | undefined {
        return state.profiles.params.endAccess
    }

    @Selector()
    public static userEventProfilesPageOrderParam (state: RegistryStateModel): OrderEnum {
        return state.profiles.params.order
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
    public static userEventProfileInvitationsPageSearchParam (state: RegistryStateModel): string | undefined {
        return state.invitations.params.searched
    }

    @Selector()
    public static userEventProfileInvitationsPageStartAccessParam (state: RegistryStateModel): string | undefined {
        return state.invitations.params.startAccess
    }

    @Selector()
    public static userEventProfileInvitationsPageEndAccessParam (state: RegistryStateModel): string | undefined {
        return state.invitations.params.endAccess
    }

    @Selector()
    public static userEventProfileInvitationsPageOrderParam (state: RegistryStateModel): OrderEnum {
        return state.invitations.params.order
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
        return this.service.getLogoutUri( `${location.origin}/${AppRouteEnum.LOGOUT_CALLBACK}` ).pipe(
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

    @Action( StartContextEventLoader )
    public startContextEventLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateContextEventLoader( ctx, true )
    }

    @Action( StopContextEventLoader )
    public stopContextEventLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateContextEventLoader( ctx, false )
    }

    private updateContextEventLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            event: {
                ...ctx.getState().event,
                loading: loading,
            },
        } )
    }

    @Action( FetchContextEvent )
    public fetchContextEvent (
        ctx: StateContext<RegistryStateModel>,
        payload: FetchContextEvent,
    ): Observable<void> {
        if (!payload.force && ctx.getState().event.element?.id === payload.eventId) {
            return of()
        }

        return this.eventService.findEventById( payload.eventId ).pipe(
            initialize( (): void => this.registryFacade.startContextEventLoader() ),
            finalize( (): void => this.registryFacade.stopContextEventLoader() ),
            map( (event: EventModel): void => this.fetchContextEventComplete( ctx, event ) ),
        )
    }

    private fetchContextEventComplete (
        ctx: StateContext<RegistryStateModel>,
        profile: EventModel,
    ): void {
        ctx.patchState( {
            event: {
                ...ctx.getState().event,
                element: profile,
            },
        } )
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
            payload.offset,
            payload.limit,
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

    @Action( InputUserEventProfilesPageSearch )
    public inputUserEventProfilesPageSearch (
        ctx: StateContext<RegistryStateModel>,
        payload: InputUserEventProfilesPageSearch,
    ): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles,
                params: {
                    ...ctx.getState().profiles.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputUserEventProfilesPageDateRange )
    public inputUserEventProfilesPageDateRange (
        ctx: StateContext<RegistryStateModel>,
        payload: InputUserEventProfilesPageDateRange,
    ): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles,
                params: {
                    ...ctx.getState().profiles.params,
                    startAccess: payload.begin?.toISOString(),
                    endAccess: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectUserEventProfilesPageOrder )
    public selectUserEventProfilesPageOrder (
        ctx: StateContext<RegistryStateModel>,
        payload: SelectUserEventProfilesPageOrder,
    ): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles,
                params: {
                    ...ctx.getState().profiles.params,
                    order: payload.order,
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
            payload.offset,
            payload.limit,
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

    @Action( InputUserEventProfileInvitationsPageSearch )
    public inputUserEventProfileInvitationsPageSearch (
        ctx: StateContext<RegistryStateModel>,
        payload: InputUserEventProfileInvitationsPageSearch,
    ): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                params: {
                    ...ctx.getState().invitations.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputUserEventProfileInvitationsPageDateRange )
    public inputUserEventProfileInvitationsPageDateRange (
        ctx: StateContext<RegistryStateModel>,
        payload: InputUserEventProfileInvitationsPageDateRange,
    ): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                params: {
                    ...ctx.getState().invitations.params,
                    startAccess: payload.begin?.toISOString(),
                    endAccess: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectUserEventProfileInvitationsPageOrder )
    public selectUserEventProfileInvitationsPageOrder (
        ctx: StateContext<RegistryStateModel>,
        payload: SelectUserEventProfileInvitationsPageOrder,
    ): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                params: {
                    ...ctx.getState().invitations.params,
                    order: payload.order,
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
            `success.title.event-profile.manage-acceptance.${profile.status}`,
            `success.message.event-profile.manage-acceptance.${profile.status}`,
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
            'success.title.event-profile.select',
            'success.message.event-profile.select',
            'pi pi-verified',
            { name: profile.event.name },
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
            'success.title.event-profile.delete',
            'success.message.event-profile.delete.mine',
            'pi pi-user',
            { name: profile.event.name },
        )
        this.registryFacade.fetchCurrentUser()
        this.refreshProfilesPage( ctx )
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
        this.registryFacade.fetchEventProfilePage( page?.offset, page?.limit, true )
    }

    protected refreshInvitationsPage (ctx: StateContext<RegistryStateModel>): void {
        const page: PageModel<EventProfileModel> | undefined = ctx.getState().invitations.element
        this.registryFacade.fetchEventProfileInvitationPage( page?.offset, page?.limit, true )
    }
}
