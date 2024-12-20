import { inject, Injectable } from '@angular/core'
import { Actions, ofActionSuccessful, Store } from '@ngxs/store'
import { ToastMessageOptions } from 'primeng/api'
import { map, Observable } from 'rxjs'
import { TokenModel } from '../../util-authentication/model/token.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageModel } from '../../util-model/model/page.model'
import { StateModel } from '../../util-model/model/state.model'
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
    Login,
    Logout,
    ManageEventInvitationAcceptance,
    Notify,
    RefreshToken,
    SelectInvitationPageOrder,
    SelectProfilePageOrder,
    SelectUserEventProfile,
    SetGlobalError,
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
    UpdateTheme,
} from './registry.action'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { StateUtil } from '../../util-tool/state/state.util'
import { OrderEnum } from '../../util-model/enumeration/order.enum'
import { FormUtil } from '../../util-tool/util/form.util'
import { EventModel } from '../../util-model/model/event.model'
import { HttpErrorResponse } from '@angular/common/http'
import { AppConfig } from '../../../app.config'

@Injectable()
export class RegistryFacade {
    private readonly actions$: Actions = inject( Actions )

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

    public constructor (private readonly ngStore: Store) {}

    public get globalError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.registry._util.error )
    }

    public get globalLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.registry._util.loading )
    }

    public get actualToken (): TokenModel | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): TokenModel | undefined => state.registry.authentication.token )
    }

    public get actualCurrentUser (): CurrentUserModel | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): CurrentUserModel | undefined => state.registry.authentication.currentUser )
    }

    public get currentUser (): Observable<CurrentUserModel | undefined> {
        return this.ngStore.select( (state: StateModel): CurrentUserModel | undefined => state.registry.authentication.currentUser )
    }

    public get logoPath (): Observable<string> {
        return this.ngStore.select( (state: StateModel): 'light' | 'dark' => state.registry._util.theme ).pipe(
            map( (theme: 'light' | 'dark'): string => theme === 'light' ? AppConfig.config.logo.light : AppConfig.config.logo.dark ),
        )
    }

    public get profilesPage (): Observable<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<EventProfileModel> | undefined => state.registry.profiles.element )
    }

    public get actualProfilePageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.registry.profiles.params.searched )
    }

    public get actualProfilePageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => FormUtil.buildDateRange(
            state.registry.profiles.params.startAccess,
            state.registry.profiles.params.endAccess,
        ) )
    }

    public get actualProfilePageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.registry.profiles.params.order )
    }

    public get profilesLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.registry.profiles.loading )
    }

    public get profilesSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.registry.profiles.silentLoading )
    }

    public get profilesError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.registry.profiles.error )
    }

    public get invitationPage (): Observable<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<EventProfileModel> | undefined => state.registry.invitations.element )
    }

    public get actualInvitationPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.registry.invitations.params.searched )
    }

    public get actualInvitationPageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => FormUtil.buildDateRange(
            state.registry.invitations.params.startAccess,
            state.registry.invitations.params.endAccess,
        ) )
    }

    public get actualInvitationPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.registry.invitations.params.order )
    }

    public get invitationsLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.registry.invitations.loading )
    }

    public get invitationsSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.registry.invitations.silentLoading )
    }

    public get invitationsError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.registry.invitations.error )
    }

    public get contextEvent (): Observable<EventModel | undefined> {
        return this.ngStore.select( (state: StateModel): EventModel | undefined => state.registry.event.element )
    }

    public get actualContextEventId (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.registry.event.element?.id )
    }

    public get contextEventLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.registry.event.loading )
    }

    public get contextEventError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.registry.event.error )
    }

    public get notification (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.registry._util.notification )
    }

    private get actualOnline (): boolean | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean | undefined => state.registry._util.online )
    }

    public startGlobalLoader (): void {
        this.ngStore.dispatch( StartGlobalLoader )
    }

    public stopGlobalLoader (): void {
        this.ngStore.dispatch( StopGlobalLoader )
    }

    public setGlobalError (error: HttpErrorResponse): void {
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

    public localSignOut (): void {
        this.ngStore.dispatch( LocalSignOut )
    }

    public fetchCurrentUser (force: boolean = false): void {
        this.ngStore.dispatch( new FetchCurrentUser( force ) )
    }

    public fetchToken (authorizationCode: string): void {
        this.ngStore.dispatch( new FetchToken( authorizationCode ) )
    }

    public refreshToken (): Observable<RefreshToken> {
        this.ngStore.dispatch( RefreshToken )
        return this.actions$.pipe( ofActionSuccessful( RefreshToken ) )
    }

    public startProfilesPageLoader (): void {
        this.ngStore.dispatch( StartProfilesPageLoader )
    }

    public stopProfilesPageLoader (): void {
        this.ngStore.dispatch( StopProfilesPageLoader )
    }

    public fetchEventProfilePage (offset: number | undefined, limit: number | undefined, force: boolean): void {
        this.ngStore.dispatch( new FetchUserEventProfilePage( offset, limit, force ) )
    }

    public inputProfilesPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputProfilePageSearch( searched ) )
    }

    public inputProfilesPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputProfilePageDateRange( range?.[0], range?.[1] ) )
    }

    public selectProfilesPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectProfilePageOrder( order ) )
    }

    public startInvitationsPageLoader (): void {
        this.ngStore.dispatch( StartInvitationsPageLoader )
    }

    public stopInvitationsPageLoader (): void {
        this.ngStore.dispatch( StopInvitationsPageLoader )
    }

    public fetchEventProfileInvitationPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchUserEventProfileInvitationPage( offset, limit, force ) )
    }

    public inputInvitationsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputInvitationPageSearch( searched ) )
    }

    public inputInvitationsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputInvitationPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectInvitationsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectInvitationPageOrder( order ) )
    }

    public startProfileLoader (): void {
        this.ngStore.dispatch( StartProfileLoader )
    }

    public stopProfileLoader (): void {
        this.ngStore.dispatch( StopProfileLoader )
    }

    public updateTheme (theme: 'light' | 'dark'): void {
        this.ngStore.dispatch( new UpdateTheme( theme ) )
    }

    public manageEventInvitationAcceptance (id: string, status: ProfileStatusEnum): void {
        this.ngStore.dispatch( new ManageEventInvitationAcceptance( id, status ) )
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
