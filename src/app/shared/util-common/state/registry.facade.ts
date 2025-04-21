import { computed, Injectable, Signal } from '@angular/core'
import { ActionCompletion, ofActionCompleted, ofActionSuccessful } from '@ngxs/store'
import { ToastMessageOptions } from 'primeng/api'
import { Observable } from 'rxjs'
import { TokenModel } from '../../util-authentication/model/token.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageModel } from '../../util-model/model/page.model'
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
import { StateUtil } from '../../util-tool/state/state.util'
import { EventModel } from '../../util-model/model/event.model'
import { AppConfig } from '../../../app.config'
import { ErrorModel } from '../../util-model/model/error.model'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { TOKEN } from '../../util-tool/util/request.util'
import { GenericFacade } from '../../util-tool/facade/generic.facade'
import { RegistryState } from './registry.state'
import { DateUtil } from '../../util-tool/util/date.util'
import { StringUtil } from '../../util-tool/util/string.util'

@Injectable()
export class RegistryFacade extends GenericFacade {
    private readonly onlineMessage: ToastMessageOptions = StateUtil.buildNotificationMessage(
        'success',
        'global.notifications.ONLINE.title',
        'global.notifications.ONLINE.message',
        'pi pi-sort-alt',
    )

    private readonly offlineMessage: ToastMessageOptions = StateUtil.buildNotificationMessage(
        'warn',
        'global.notifications.OFFLINE.title',
        'global.notifications.OFFLINE.message',
        'pi pi-sort-alt-slash',
    )

    public get theme (): Signal<'light' | 'dark'> {
        return this.ngStore.selectSignal( RegistryState.theme )
    }

    public get tinyScreen (): Signal<boolean> {
        return computed( (): boolean => this.ngStore.selectSignal( RegistryState.screenWidth )() < 768 )
    }

    public get globalLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.globalLoading )
    }

    public get globalError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( RegistryState.globalError )
    }

    private get online (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( RegistryState.online )
    }

    public get logoPath (): Signal<string> {
        return computed( (): string => this.theme() === 'light' ? AppConfig.config.logo.light : AppConfig.config.logo.dark )
    }

    public get notification (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( RegistryState.notification )
    }

    public get token (): Signal<TokenModel | undefined> {
        return this.ngStore.selectSignal( RegistryState.tokens )
    }

    public get currentUser (): Signal<CurrentUserModel | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUser )
    }

    public get selectedEvent (): Signal<EventModel | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserSelectedEvent )
    }

    public get userEventProfilesPage (): Signal<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.selectSignal( RegistryState.userEventProfilesPage )
    }

    public get userEventProfilesPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userEventProfilesPageLoading )
    }

    public get userEventProfilesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userEventProfilesPageSilentLoading )
    }

    public get userEventProfilesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( RegistryState.userEventProfilesPageError )
    }

    public get userEventProfilesPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userEventProfilesPageResetSearch )
    }

    public get userEventProfilesPageTextSearchParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.userEventProfilesPageTextSearchParam )
    }

    public get userEventProfilesPageDateTimeSearchParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( RegistryState.userEventProfilesPageDateTimeSearchParam )() ),
        )
    }

    public get userEventProfileInvitationsPage (): Signal<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.selectSignal( RegistryState.userEventProfileInvitationsPage )
    }

    public get userEventProfileInvitationsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userEventProfileInvitationsPageLoading )
    }

    public get userEventProfileInvitationsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userEventProfileInvitationsPageSilentLoading )
    }

    public get userEventProfileInvitationsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( RegistryState.userEventProfileInvitationsPageError )
    }

    public get userEventProfileInvitationsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userEventProfileInvitationsPageResetSearch )
    }

    public get userEventProfileInvitationsPageTextSearchParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.userEventProfileInvitationsPageTextSearchParam )
    }

    public get userEventProfileInvitationsPageDateTimeSearchParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( RegistryState.userEventProfileInvitationsPageDateTimeParam )() ),
        )
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
        if (this.online() != undefined) {
            this.notify( online ? this.onlineMessage : this.offlineMessage )
        }

        this.ngStore.dispatch( new UpdateNetwork( online ) )
    }

    public updateScreenWidth (screenWidth: number): void {
        this.ngStore.dispatch( new UpdateScreenWidth( screenWidth ) )
    }

    public notify (message: ToastMessageOptions): void {
        if (message.summary?.endsWith( '401' )) {
            return
        }

        let formattedMessage: ToastMessageOptions = message
        if (StringUtil.isBlank( message.detail ) && StringUtil.isBlank( message.summary )) {
            formattedMessage = {
                ...message,
                detail: this.translateService.instant( 'global.notifications.UNKNOWN_ERROR' ),
            }
        }

        this.ngStore.dispatch( new Notify( formattedMessage ) )
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

    public fetchEventProfilePage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.userEventProfilesPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchUserEventProfilesPage( index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userEventProfilesPageTextSearchParam() != textSearched
                                     || this.userEventProfilesPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateUserEventProfilesPageSearchParams(
                resetSearch, textSearched, dateTimeSearched?.toISOString(),
            ) )
        }
    }

    public startInvitationsPageLoader (): void {
        this.ngStore.dispatch( StartUserEventProfileInvitationsPageLoader )
    }

    public stopInvitationsPageLoader (): void {
        this.ngStore.dispatch( StopUserEventProfileInvitationsPageLoader )
    }

    public fetchEventProfileInvitationPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.userEventProfileInvitationsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchUserEventProfileInvitationsPage( index, pageSize, force ) )
    }

    public inputInvitationsPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userEventProfileInvitationsPageTextSearchParam() != textSearched
                                     || this.userEventProfileInvitationsPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateUserEventProfileInvitationsPageSearchParams(
                resetSearch, textSearched, dateTimeSearched?.toISOString(),
            ) )
        }
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

    public selectUserEventProfile (profile: EventProfileModel): Observable<ActionCompletion<SelectUserEventProfile>> {
        this.ngStore.dispatch( new SelectUserEventProfile( profile ) )

        return this.actions$.pipe( ofActionCompleted( SelectUserEventProfile ) )
    }

    public selectUserEventProfileByEvent (event: EventModel): Observable<ActionCompletion<SelectUserEventProfileByEvent>> {
        this.ngStore.dispatch( new SelectUserEventProfileByEvent( event ) )

        return this.actions$.pipe( ofActionCompleted( SelectUserEventProfileByEvent ) )
    }

    public deleteUserEventProfile (profile: EventProfileModel): Observable<ActionCompletion<DeleteUserEventProfile>> {
        this.ngStore.dispatch( new DeleteUserEventProfile( profile ) )

        return this.actions$.pipe( ofActionCompleted( DeleteUserEventProfile ) )
    }

    public createSupportEventProfile (eventId: string): Observable<ActionCompletion<CreateSupportEventProfile>> {
        this.ngStore.dispatch( new CreateSupportEventProfile( eventId ) )

        return this.actions$.pipe( ofActionCompleted( CreateSupportEventProfile ) )
    }
}
