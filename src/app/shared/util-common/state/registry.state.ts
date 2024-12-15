import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Action, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { TokenModel } from '../../util-authentication/model/token.model'
import { SecurityService } from '../../util-authentication/service/security.service'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageModel } from '../../util-model/model/page.model'
import { GenericState } from '../../util-tool/state/generic.state'
import { CURRENT_USER, REDIRECT_URI, TOKEN } from '../../util-tool/util/request.util'
import { initialize } from '../../util-tool/util/rx.util'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { RegistryStateModel } from '../model/registry-state.model'
import {
    AckNotification,
    DeleteUserEventProfile,
    FetchContextEvent,
    FetchCurrentUser,
    FetchToken,
    FetchUserEventProfileInvitationPage,
    FetchUserEventProfilePage,
    InputInvitationPageDateRange,
    InputInvitationPageSearch,
    InputProfilePageDateRange,
    InputProfilePageSearch,
    LocalSignOut,
    ManageEventInvitationAcceptance,
    Notify,
    SelectInvitationPageOrder,
    SelectProfilePageOrder,
    SelectUserEventProfile,
    SetGlobalError,
    SignIn,
    SignOut,
    StartContextEventLoader,
    StartGlobalLoader,
    StartInvitationsPageLoader,
    StartProfileLoader,
    StartProfilesPageLoader,
    StopContextEventLoader,
    StopGlobalLoader,
    StopInvitationsPageLoader,
    StopProfileLoader,
    StopProfilesPageLoader,
    UpdateNetwork,
} from './registry.action'
import { UserEventProfileService } from './user-event-profile.service'
import { OrderEnum } from '../../util-model/enumeration/order.enum'
import { PreferencesService } from './preferences.service'
import { EventService } from '../../../domains/event/data/state/event.service'
import { EventModel } from '../../util-model/model/event.model'

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
            status: ProfileStatusEnum.ACCEPTED,
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
            status: ProfileStatusEnum.INVITED,
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
        error: undefined,
    },
    event: {
        element: undefined,
        loading: false,
        error: undefined,
    },
    _util: {
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
    public constructor (
        private readonly service: SecurityService,
        private readonly eventService: EventService,
        private readonly userEventProfileService: UserEventProfileService,
        private readonly preferencesService: PreferencesService,
    ) { super() }

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

    @Action( SignIn )
    public signIn (): void {
        SessionStorageUtils.set( REDIRECT_URI, window.location.pathname + window.location.search )
        this.service.signIn()
    }

    @Action( SignOut )
    public signOut (): void {
        this.service.signOut()
    }

    @Action( LocalSignOut )
    public localSignOut (ctx: StateContext<RegistryStateModel>): void {
        SessionStorageUtils.clear()
        ctx.setState( defaultRegistryState )
    }

    @Action( FetchToken )
    public fetchToken (ctx: StateContext<RegistryStateModel>): Observable<void> {
        if (SessionStorageUtils.check( TOKEN )) {
            const token: TokenModel | undefined = SessionStorageUtils.get( TOKEN ) as TokenModel
            if (new Date( token.expiredAt ) > new Date()) {
                this.fetchTokenComplete( ctx, token )
                return of()
            }
        }

        return this.service.findCurrentUserToken().pipe(
            initialize( (): void => this.registryFacade.startGlobalLoader() ),
            finalize( (): void => this.registryFacade.stopGlobalLoader() ),
            map( (token: TokenModel): void => this.fetchTokenComplete( ctx, token ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => {
                SessionStorageUtils.delete( TOKEN )
                return this.globalError( ctx, error )
            } ),
        )
    }

    private fetchTokenComplete (ctx: StateContext<RegistryStateModel>, token: TokenModel): void {
        SessionStorageUtils.set( TOKEN, token )
        ctx.patchState( {
            authentication: {
                ...ctx.getState().authentication,
                token: token,
            },
        } )
        this.registryFacade.fetchCurrentUser( true )
    }

    @Action( FetchCurrentUser )
    public fetchCurrentUser (ctx: StateContext<RegistryStateModel>, payload: FetchCurrentUser): Observable<void> {
        if (!payload.force && SessionStorageUtils.check( CURRENT_USER )) {
            this.fetchCurrentUserComplete(
                ctx,
                SessionStorageUtils.get( CURRENT_USER ) as CurrentUserModel,
            )
            return of()
        }

        return this.service.findCurrentUser().pipe(
            initialize( (): void => this.registryFacade.startGlobalLoader() ),
            finalize( (): void => this.registryFacade.stopGlobalLoader() ),
            map( (currentUser: CurrentUserModel): void => this.fetchCurrentUserComplete( ctx, currentUser ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => {
                SessionStorageUtils.delete( CURRENT_USER )
                return this.globalError( ctx, error )
            } ),
        )
    }

    private fetchCurrentUserComplete (ctx: StateContext<RegistryStateModel>, currentUser: CurrentUserModel): void {
        SessionStorageUtils.set( CURRENT_USER, currentUser )
        ctx.patchState( {
            authentication: {
                ...ctx.getState().authentication,
                currentUser: currentUser,
            },
        } )
    }

    @Action( StartProfilesPageLoader )
    public startProfilesPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateProfilesLoader( ctx, true )
    }

    @Action( StopProfilesPageLoader )
    public stopProfilesPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateProfilesLoader( ctx, false )
    }

    protected updateProfilesLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            profiles: {
                ...ctx.getState().profiles, loading: loading,
            },
        } )
    }

    @Action( FetchUserEventProfilePage )
    public fetchUserEventProfilePage (
        ctx: StateContext<RegistryStateModel>,
        payload: FetchUserEventProfilePage,
    ): Observable<void> {
        return this.userEventProfileService.findUserEventProfiles(
            payload.offset,
            payload.limit,
            ctx.getState().profiles.params,
        ).pipe(
            initialize( (): void => this.registryFacade.startProfilesPageLoader() ),
            finalize( (): void => this.registryFacade.stopProfilesPageLoader() ),
            map( (profilePage: PageModel<EventProfileModel>): void => this.fetchUserEventProfilePageComplete(
                ctx,
                profilePage,
            ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.fetchUserEventProfilePageError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchUserEventProfilePageComplete (
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

    private fetchUserEventProfilePageError (
        ctx: StateContext<RegistryStateModel>,
        error: HttpErrorResponse,
    ): Observable<void> {
        ctx.patchState( {
            profiles: this.buildErrorMessageAndNotify( ctx.getState().profiles, error ),
        } )
        throw error.error
    }

    @Action( InputProfilePageSearch )
    public inputProfilePageSearch (
        ctx: StateContext<RegistryStateModel>,
        payload: InputProfilePageSearch,
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

    @Action( InputProfilePageDateRange )
    public inputProfilePageDateRange (
        ctx: StateContext<RegistryStateModel>,
        payload: InputProfilePageDateRange,
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

    @Action( SelectProfilePageOrder )
    public selectProfilePageOrder (
        ctx: StateContext<RegistryStateModel>,
        payload: SelectProfilePageOrder,
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

    @Action( StartInvitationsPageLoader )
    public startInvitationsPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateInvitationsLoader( ctx, true )
    }

    @Action( StopInvitationsPageLoader )
    public stopInvitationsPageLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateInvitationsLoader( ctx, false )
    }

    protected updateInvitationsLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            invitations: {
                ...ctx.getState().invitations,
                loading: loading,
            },
        } )
    }

    @Action( FetchUserEventProfileInvitationPage )
    public fetchUserEventProfileInvitationPage (
        ctx: StateContext<RegistryStateModel>,
        payload: FetchUserEventProfileInvitationPage,
    ): Observable<void> {
        return this.userEventProfileService.findUserEventProfiles(
            payload.offset,
            payload.limit,
            ctx.getState().invitations.params,
        ).pipe(
            initialize( (): void => this.registryFacade.startInvitationsPageLoader() ),
            finalize( (): void => this.registryFacade.stopInvitationsPageLoader() ),
            map( (invitationPage: PageModel<EventProfileModel>): void => this.fetchUserEventProfileInvitationPageComplete(
                ctx,
                invitationPage,
            ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.fetchUserEventProfileInvitationPageError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchUserEventProfileInvitationPageComplete (
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

    private fetchUserEventProfileInvitationPageError (
        ctx: StateContext<RegistryStateModel>,
        error: HttpErrorResponse,
    ): Observable<void> {
        ctx.patchState( {
            invitations: this.buildErrorMessageAndNotify( ctx.getState().invitations, error ),
        } )
        throw error.error
    }

    @Action( InputInvitationPageSearch )
    public inputInvitationPageSearch (
        ctx: StateContext<RegistryStateModel>,
        payload: InputInvitationPageSearch,
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

    @Action( InputInvitationPageDateRange )
    public inputInvitationPageDateRange (
        ctx: StateContext<RegistryStateModel>,
        payload: InputInvitationPageDateRange,
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

    @Action( SelectInvitationPageOrder )
    public selectInvitationPageOrder (
        ctx: StateContext<RegistryStateModel>,
        payload: SelectInvitationPageOrder,
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

    @Action( StartProfileLoader )
    public startProfileLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateProfileLoader( ctx, true )
    }

    @Action( StopProfileLoader )
    public stopProfileLoader (ctx: StateContext<RegistryStateModel>): void {
        this.updateProfileLoader( ctx, false )
    }

    private updateProfileLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            profile: {
                ...ctx.getState().profile,
                loading: loading,
            },
        } )
    }

    @Action( ManageEventInvitationAcceptance )
    public manageEventInvitationAcceptance (
        ctx: StateContext<RegistryStateModel>,
        payload: ManageEventInvitationAcceptance,
    ): Observable<void> {
        return this.userEventProfileService.manageUserEventProfileAcceptance( payload.profileId, payload.status ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (profile: EventProfileModel): void => this.manageEventInvitationAcceptanceComplete( ctx, profile ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.manageEventInvitationAcceptanceError(
                ctx,
                error,
            ) ),
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

        this.registryFacade.fetchCurrentUser( true )
        this.refreshProfilesPage( ctx )
        this.refreshInvitationsPage( ctx )
    }

    private manageEventInvitationAcceptanceError (
        ctx: StateContext<RegistryStateModel>,
        error: HttpErrorResponse,
    ): Observable<void> {
        ctx.patchState( {
            profile: this.buildErrorMessageAndNotify( ctx.getState().profile, error ),
        } )
        throw error.error
    }

    @Action( SelectUserEventProfile )
    public selectEventProfile (
        ctx: StateContext<RegistryStateModel>,
        payload: SelectUserEventProfile,
    ): Observable<void> {
        return this.preferencesService.selectUserEventProfile( payload.profile.id ).pipe(
            initialize( (): void => this.registryFacade.startProfileLoader() ),
            finalize( (): void => this.registryFacade.stopProfileLoader() ),
            map( (): void => this.selectEventProfileComplete( payload.profile ) ),
            catchError( (error: HttpErrorResponse): Observable<void> => this.selectEventProfileError(
                ctx,
                error,
            ) ),
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

        this.registryFacade.fetchCurrentUser( true )
    }

    private selectEventProfileError (
        ctx: StateContext<RegistryStateModel>,
        error: HttpErrorResponse,
    ): Observable<void> {
        console.log( error )
        ctx.patchState( {
            profile: this.buildErrorMessageAndNotify( ctx.getState().profile, error ),
        } )
        throw error.error
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
            catchError( (error: HttpErrorResponse): Observable<void> => this.deleteUserEventProfileError(
                ctx,
                error,
            ) ),
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
        this.registryFacade.fetchCurrentUser( true )
        this.refreshProfilesPage( ctx )
    }

    private deleteUserEventProfileError (
        ctx: StateContext<RegistryStateModel>,
        error: HttpErrorResponse,
    ): Observable<void> {
        ctx.patchState( {
            profile: this.buildErrorMessageAndNotify( ctx.getState().profile, error ),
        } )
        throw error.error
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
            catchError( (error: HttpErrorResponse): Observable<void> => this.fetchContextEventError( ctx, error ) ),
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

    private fetchContextEventError (
        ctx: StateContext<RegistryStateModel>,
        error: HttpErrorResponse,
    ): Observable<void> {
        ctx.patchState( {
            event: this.buildErrorMessageAndNotify( ctx.getState().event, error ),
        } )
        throw error.error
    }

    private updateGlobalLoader (ctx: StateContext<RegistryStateModel>, loading: boolean): void {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                loading: loading,
            },
        } )
    }

    private globalError (ctx: StateContext<RegistryStateModel>, error: HttpErrorResponse): Observable<void> {
        ctx.patchState( {
            _util: {
                ...ctx.getState()._util,
                error: this.buildError( error ),
            },
        } )
        throw error.error
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
