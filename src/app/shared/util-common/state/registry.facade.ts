import { Injectable } from '@angular/core'
import { ofActionSuccessful } from '@ngxs/store'
import { ToastMessageOptions } from 'primeng/api'
import { map, Observable } from 'rxjs'
import { TokenModel } from '../../util-authentication/model/token.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageModel } from '../../util-model/model/page.model'
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
import { StateUtil } from '../../util-tool/state/state.util'
import { OrderEnum } from '../../util-model/enumeration/order.enum'
import { FormUtil } from '../../util-tool/util/form.util'
import { EventModel } from '../../util-model/model/event.model'
import { AppConfig } from '../../../app.config'
import { ErrorModel } from '../../util-model/model/error.model'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { TOKEN } from '../../util-tool/util/request.util'
import { GenericFacade } from '../../util-tool/facade/generic.facade'
import { RegistryState } from './registry.state'

@Injectable()
export class RegistryFacade extends GenericFacade {

    private readonly onlineMessage: ToastMessageOptions = StateUtil.buildNotificationMessage(
        'success',
        'success.title.online',
        'success.message.online',
        'pi pi-sort-alt',
    )

    private readonly offlineMessage: ToastMessageOptions = StateUtil.buildNotificationMessage(
        'warn',
        'warning.title.OFFLINE',
        'warning.message.OFFLINE',
        'pi pi-sort-alt-slash',
    )

    public get globalLoading (): Observable<boolean> {
        return this.ngStore.select( RegistryState.globalLoading )
    }

    public get globalError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( RegistryState.globalError )
    }

    private get actualOnline (): boolean | undefined {
        return this.ngStore.selectSnapshot( RegistryState.online )
    }

    public get logoPath (): Observable<string> {
        return this.ngStore.select( RegistryState.theme ).pipe(
            map( (theme: 'light' | 'dark'): string => theme === 'light' ? AppConfig.config.logo.light : AppConfig.config.logo.dark ),
        )
    }

    public get notification (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( RegistryState.notification )
    }

    public get actualToken (): TokenModel | undefined {
        return this.ngStore.selectSnapshot( RegistryState.tokens )
    }

    public get contextEventLoading (): Observable<boolean> {
        return this.ngStore.select( RegistryState.contextEventLoading )
    }

    public get contextEvent (): Observable<EventModel | undefined> {
        return this.ngStore.select( RegistryState.contextEvent )
    }

    public get actualContextEventId (): string | undefined {
        return this.ngStore.selectSnapshot( RegistryState.contextEventId )
    }

    public get currentUser (): Observable<CurrentUserModel | undefined> {
        return this.ngStore.select( RegistryState.currentUser )
    }

    public get actualCurrentUser (): CurrentUserModel | undefined {
        return this.ngStore.selectSnapshot( RegistryState.currentUser )
    }

    public get userEventProfilesPage (): Observable<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.select( RegistryState.userEventProfilesPage )
    }

    public get userEventProfilesPageLoading (): Observable<boolean> {
        return this.ngStore.select( RegistryState.userEventProfilesPageLoading )
    }

    public get userEventProfilesPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( RegistryState.userEventProfilesPageSilentLoading )
    }

    public get userEventProfilesPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( RegistryState.userEventProfilesPageError )
    }

    public get actualUserEventProfilesPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( RegistryState.userEventProfilesPageSearchParam )
    }

    public get actualUserEventProfilesPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( RegistryState.userEventProfilesPageStartAccessParam ),
            this.ngStore.selectSnapshot( RegistryState.userEventProfilesPageEndAccessParam ),
        )
    }

    public get actualUserEventProfilesPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( RegistryState.userEventProfilesPageOrderParam )
    }

    public get userEventProfileInvitationsPage (): Observable<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.select( RegistryState.userEventProfileInvitationsPage )
    }

    public get userEventProfileInvitationsPageLoading (): Observable<boolean> {
        return this.ngStore.select( RegistryState.userEventProfileInvitationsPageLoading )
    }

    public get userEventProfileInvitationsPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( RegistryState.userEventProfileInvitationsPageSilentLoading )
    }

    public get userEventProfileInvitationsPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( RegistryState.userEventProfileInvitationsPageError )
    }

    public get actualUserEventProfileInvitationsPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( RegistryState.userEventProfileInvitationsPageSearchParam )
    }

    public get actualUserEventProfileInvitationsPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( RegistryState.userEventProfileInvitationsPageStartAccessParam ),
            this.ngStore.selectSnapshot( RegistryState.userEventProfileInvitationsPageEndAccessParam ),
        )
    }

    public get actualUserEventProfileInvitationsPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( RegistryState.userEventProfileInvitationsPageOrderParam )
    }

    public startGlobalLoader (): void {
        this.ngStore.dispatch( StartGlobalLoader )
    }

    public stopGlobalLoader (): void {
        this.ngStore.dispatch( StopGlobalLoader )
    }

    public setGlobalError (error: ErrorModel): void {
        this.ngStore.dispatch( new SetGlobalError( error ) )
    }

    public updateNetwork (online: boolean): void {
        if (this.actualOnline != undefined) {
            this.notify( online ? this.onlineMessage : this.offlineMessage )
        }

        this.ngStore.dispatch( new UpdateNetwork( online ) )
    }

    public notify (message: ToastMessageOptions): void {
        if (message.summary?.endsWith( '401' )) {
            return
        }
        this.ngStore.dispatch( new Notify( message ) )
    }

    public ackNotification (): void {
        this.ngStore.dispatch( AckNotification )
    }

    public login (): void {
        this.ngStore.dispatch( Login )
    }

    public logout (): void {
        this.ngStore.dispatch( Logout )
    }

    public fetchCurrentUser (): void {
        this.ngStore.dispatch( FetchCurrentUser )
    }

    public impersonateCurrentUser (): void {
        this.ngStore.dispatch( ImpersonateCurrentUser )
    }

    public restoreTokensFromSessionStorage (): void {
        if (SessionStorageUtils.check( TOKEN )) {
            this.ngStore.dispatch( new RestoreTokens( SessionStorageUtils.get( TOKEN ) as TokenModel ) )
        }
    }

    public fetchToken (authorizationCode: string): void {
        this.ngStore.dispatch( new FetchTokens( authorizationCode ) )
    }

    public refreshToken (): Observable<RefreshTokens> {
        this.ngStore.dispatch( RefreshTokens )
        return this.actions$.pipe( ofActionSuccessful( RefreshTokens ) )
    }

    public startProfilesPageLoader (): void {
        this.ngStore.dispatch( StartUserEventProfilesPageLoader )
    }

    public stopProfilesPageLoader (): void {
        this.ngStore.dispatch( StopUserEventProfilesPageLoader )
    }

    public fetchEventProfilePage (offset: number | undefined, limit: number | undefined, force: boolean): void {
        this.ngStore.dispatch( new FetchUserEventProfilesPage( offset, limit, force ) )
    }

    public inputProfilesPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputUserEventProfilesPageSearch( searched ) )
    }

    public inputProfilesPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputUserEventProfilesPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectProfilesPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectUserEventProfilesPageOrder( order ) )
    }

    public startInvitationsPageLoader (): void {
        this.ngStore.dispatch( StartUserEventProfileInvitationsPageLoader )
    }

    public stopInvitationsPageLoader (): void {
        this.ngStore.dispatch( StopUserEventProfileInvitationsPageLoader )
    }

    public fetchEventProfileInvitationPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchUserEventProfileInvitationsPage( offset, limit, force ) )
    }

    public inputInvitationsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputUserEventProfileInvitationsPageSearch( searched ) )
    }

    public inputInvitationsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputUserEventProfileInvitationsPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectInvitationsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectUserEventProfileInvitationsPageOrder( order ) )
    }

    public startProfileLoader (): void {
        this.ngStore.dispatch( StartUserEventProfileLoader )
    }

    public stopProfileLoader (): void {
        this.ngStore.dispatch( StopUserEventProfileLoader )
    }

    public updateTheme (theme: 'light' | 'dark'): void {
        this.ngStore.dispatch( new UpdateTheme( theme ) )
    }

    public manageEventInvitationAcceptance (id: string, accepted: boolean): void {
        this.ngStore.dispatch( new ManageUserEventInvitationAcceptance( id, accepted ) )
    }

    public selectUserEventProfile (profile: EventProfileModel): void {
        this.ngStore.dispatch( new SelectUserEventProfile( profile ) )
    }

    public deleteUserEventProfile (profile: EventProfileModel): void {
        this.ngStore.dispatch( new DeleteUserEventProfile( profile ) )
    }

    public startContextEventLoader (): void {
        this.ngStore.dispatch( StartContextEventLoader )
    }

    public stopContextEventLoader (): void {
        this.ngStore.dispatch( StopContextEventLoader )
    }

    public fetchContextEvent (id: string, force: boolean = false): void {
        this.ngStore.dispatch( new FetchContextEvent( id, force ) )
    }
}
