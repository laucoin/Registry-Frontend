import { computed, inject, Injectable, Signal } from '@angular/core'
import { ActionCompletion, ofActionCompleted } from '@ngxs/store'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { filter, map, Observable } from 'rxjs'
import { TokenModel } from '../../util-authentication/model/token.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { ProjectProfileModel } from '../../util-model/model/project-profile.model'
import { PageModel } from '../../util-model/model/page.model'
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
    UpdateCurrentUserLanguage,
    UpdateCurrentUserTheme,
    UpdateNetwork,
    UpdateScreenWidth,
    UpdateTheme,
    UpdateUserProjectProfileInvitationsPageSearchParams,
    UpdateUserProjectProfilesPageSearchParams,
} from './registry.action'
import { StateUtil } from '../../util-tool/state/state.util'
import { ProjectModel } from '../../util-model/model/project.model'
import { AppConfig } from '../../../app.config'
import { ErrorModel } from '../../util-model/model/error.model'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { REDIRECT_URI, TOKEN } from '../../util-tool/util/request.util'
import { GenericFacade } from '../../util-tool/facade/generic.facade'
import { RegistryState } from './registry.state'
import { DateUtil } from '../../util-tool/util/date.util'
import { StringUtil } from '../../util-tool/util/string.util'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { ThemeEnum } from '../../util-model/enumeration/theme.enum'
import { ResetSelectedProjectState } from '../../../domains/project/data/state/selected-project/selected-project.action'
import {
    FetchMovementTypes,
    FetchParticipantTypes,
    ResetMovementState,
} from '../../../domains/project/movement/data/state/movement.action'
import { ResetActivityState } from '../../../domains/project/configuration/activity/data/state/activity.action'
import { ResetCommunicationState } from '../../../domains/project/communication/data/state/communication.action'
import {
    FetchParticipantPresencesStatus,
    ResetParticipantState,
} from '../../../domains/project/configuration/participant/data/state/participant.action'
import {
    FetchVehiclePresencesStatus,
    ResetVehicleState,
} from '../../../domains/project/configuration/vehicle/data/state/vehicle.action'
import { FetchAlertStatus } from '../../../domains/project/alert/data/state/alert.action'
import {
    FetchProfileStatus,
} from '../../../domains/project/configuration/project-profile/data/state/project-profile.action'
import { PrimeNG } from 'primeng/config'

@Injectable()
export class RegistryFacade extends GenericFacade {
    private readonly primeConfig: PrimeNG = inject( PrimeNG )

    private readonly onlineMessage: ToastMessageOptions = StateUtil.buildNotificationMessage(
        SeverityEnum.SUCCESS,
        'global.notifications.ONLINE.title',
        'global.notifications.ONLINE.message',
        'pi pi-sort-alt',
    )

    private readonly offlineMessage: ToastMessageOptions = StateUtil.buildNotificationMessage(
        SeverityEnum.WARNING,
        'global.notifications.OFFLINE.title',
        'global.notifications.OFFLINE.message',
        'pi pi-sort-alt-slash',
    )

    public get theme (): Signal<ThemeEnum> {
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
        return computed( (): string => {
            switch (true) {
                case this.theme() === ThemeEnum.DARK && this.tinyScreen():
                    return AppConfig.settings.logo.small.dark
                case this.theme() === ThemeEnum.DARK && !this.tinyScreen():
                    return AppConfig.settings.logo.normal.dark
                case this.theme() === ThemeEnum.LIGHT && this.tinyScreen():
                    return AppConfig.settings.logo.small.light
                default:
                    return AppConfig.settings.logo.normal.light
            }
        } )
    }

    public get notification (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( RegistryState.notification )
    }

    public get token (): Signal<TokenModel | undefined> {
        return this.ngStore.selectSignal( RegistryState.tokens )
    }

    public get currentUser$ (): Observable<CurrentUserModel> {
        return this.ngStore.select( RegistryState.currentUser ).pipe(
            filter( (user: CurrentUserModel | undefined): boolean => GenericUtil.nonNull( user ) ),
            map( (user: CurrentUserModel | undefined): CurrentUserModel => user! ),
        )
    }

    public get currentUser (): Signal<CurrentUserModel | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUser )
    }

    public get currentUserTheme (): Signal<ThemeEnum | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserTheme )
    }

    public get currentUserLanguage (): Signal<string> {
        return this.ngStore.selectSignal( RegistryState.currentUserLanguage )
    }

    public get selectedProject (): Signal<ProjectModel | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserSelectedProject )
    }

    public get userProjectProfilesPage (): Signal<PageModel<ProjectProfileModel> | undefined> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfilesPage )
    }

    public get userProjectProfilesPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfilesPageLoading )
    }

    public get userProjectProfilesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfilesPageSilentLoading )
    }

    public get userProjectProfilesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfilesPageError )
    }

    public get userProjectProfilesPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfilesPageResetSearch )
    }

    public get userProjectProfilesPageTextSearchParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfilesPageTextSearchParam )
    }

    public get userProjectProfilesPageDateTimeSearchParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( RegistryState.userProjectProfilesPageDateTimeSearchParam )() ),
        )
    }

    public get userProjectProfilesPageAvailabilitySearchParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfilesPageAvailabilitySearchParam )
    }

    public get userProjectProfileInvitationsPage (): Signal<PageModel<ProjectProfileModel> | undefined> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfileInvitationsPage )
    }

    public get userProjectProfileInvitationsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfileInvitationsPageLoading )
    }

    public get userProjectProfileInvitationsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfileInvitationsPageSilentLoading )
    }

    public get userProjectProfileInvitationsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfileInvitationsPageError )
    }

    public get userProjectProfileInvitationsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfileInvitationsPageResetSearch )
    }

    public get userProjectProfileInvitationsPageTextSearchParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.userProjectProfileInvitationsPageTextSearchParam )
    }

    public get userProjectProfileInvitationsPageDateTimeSearchParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( RegistryState.userProjectProfileInvitationsPageDateTimeParam )() ),
        )
    }

    public get themesMetadata (): Signal<SelectItem<ThemeEnum>[]> {
        return this.ngStore.selectSignal( RegistryState.themesMetadata )
    }

    public get languagesMetadata (): Signal<SelectItem<string>[]> {
        return computed( () =>
            this.ngStore.selectSignal( RegistryState.languagesMetadata )().map( (lang: SelectItem<string>): SelectItem<string> => ({
                ...lang,
                label: this.translateService.instant( lang.label! ),
            }) ),
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
        if (StringUtil.isNullOrBlank( message.detail ) && StringUtil.isNullOrBlank( message.summary )) {
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

    public startCurrentUserActionLoader (): void {
        this.ngStore.dispatch( StartCurrentUserActionLoader )
    }

    public stopCurrentUserActionLoader (): void {
        this.ngStore.dispatch( StopCurrentUserActionLoader )
    }

    public login (): void {
        SessionStorageUtils.set( REDIRECT_URI, location.pathname )
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

    public restoreSessionFromStorage (): void {
        if (SessionStorageUtils.check( TOKEN )) {
            this.ngStore.dispatch( new RestoreSessionFromStorage( SessionStorageUtils.get( TOKEN ) as TokenModel ) )
        }
    }

    public fetchToken (authorizationCode: string): void {
        this.ngStore.dispatch( new FetchTokens( authorizationCode ) )
    }

    public startProfilesPageLoader (): void {
        this.ngStore.dispatch( StartUserProjectProfilesPageLoader )
    }

    public stopProfilesPageLoader (): void {
        this.ngStore.dispatch( StopUserProjectProfilesPageLoader )
    }

    public fetchProjectProfilesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.userProjectProfilesPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchUserProjectProfilesPage( index, pageSize, force ) )
    }

    public inputProfilesPageSearchParameters (
        textSearched: string | undefined,
        availabilitySearched: boolean | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfilesPageTextSearchParam() != textSearched
                                     || this.userProjectProfilesPageAvailabilitySearchParam() != availabilitySearched
                                     || this.userProjectProfilesPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateUserProjectProfilesPageSearchParams(
                resetSearch, textSearched, availabilitySearched, dateTimeSearched?.toISOString(),
            ) )
        }
    }

    public startInvitationsPageLoader (): void {
        this.ngStore.dispatch( StartUserProjectProfileInvitationsPageLoader )
    }

    public stopInvitationsPageLoader (): void {
        this.ngStore.dispatch( StopUserProjectProfileInvitationsPageLoader )
    }

    public fetchProjectProfileInvitationPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.userProjectProfileInvitationsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchUserProjectProfileInvitationsPage( index, pageSize, force ) )
    }

    public inputInvitationsPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.userProjectProfileInvitationsPageTextSearchParam() != textSearched
                                     || this.userProjectProfileInvitationsPageDateTimeSearchParam() != dateTimeSearched?.toISOString()

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateUserProjectProfileInvitationsPageSearchParams(
                resetSearch, textSearched, dateTimeSearched?.toISOString(),
            ) )
        }
    }

    public startProfileLoader (): void {
        this.ngStore.dispatch( StartUserProjectProfileLoader )
    }

    public stopProfileLoader (): void {
        this.ngStore.dispatch( StopUserProjectProfileLoader )
    }

    public updateTheme (theme: ThemeEnum | undefined): void {
        if (GenericUtil.nonNull( theme )) {
            this.ngStore.dispatch( new UpdateTheme( theme! ) )
        }
    }

    public updateCurrentUserTheme (theme: ThemeEnum | undefined): void {
        if (GenericUtil.isNull( theme )) return
        this.ngStore.dispatch( [ new UpdateCurrentUserTheme( theme! ), new UpdateTheme( theme! ) ] )
    }

    public reloadTranslatedData (): void {
        this.ngStore.dispatch( [
            FetchCurrentUser,
            FetchMovementTypes,
            FetchParticipantTypes,
            FetchParticipantPresencesStatus,
            FetchVehiclePresencesStatus,
            FetchAlertStatus,
            FetchProfileStatus,
        ] )
    }

    public updateCurrentUserLanguage (language: string): void {
        this.translateService.use( language )
        this.primeConfig.setTranslation( this.translateService.instant( 'prime-ng' ) )
        this.reloadTranslatedData()
        this.ngStore.dispatch( new UpdateCurrentUserLanguage( language ) )
    }

    public manageProjectInvitationAcceptance (id: string, accepted: boolean): void {
        this.ngStore.dispatch( new ManageUserProjectInvitationAcceptance( id, accepted ) )
    }

    public selectUserProjectProfile (id: string | undefined): Observable<ActionCompletion<FetchCurrentUser>> {
        this.ngStore.dispatch( [
            new ResetSelectedProjectState(),
            new ResetMovementState(),
            new ResetActivityState(),
            new ResetCommunicationState(),
            new ResetParticipantState(),
            new ResetVehicleState(),
            new SelectUserProjectProfile( id ),
        ] )

        return this.actions$.pipe( ofActionCompleted( FetchCurrentUser ) )
    }

    public selectUserProjectProfileByProject (projectId: string): Observable<ActionCompletion<FetchCurrentUser>> {
        this.ngStore.dispatch( [
            new ResetSelectedProjectState(),
            new ResetMovementState(),
            new ResetActivityState(),
            new ResetCommunicationState(),
            new ResetParticipantState(),
            new ResetVehicleState(),
            new SelectUserProjectProfileByProject( projectId ),
        ] )

        return this.actions$.pipe( ofActionCompleted( FetchCurrentUser ) )
    }

    public deleteUserProjectProfile (profile: ProjectProfileModel): Observable<ActionCompletion<DeleteUserProjectProfile>> {
        this.ngStore.dispatch( new DeleteUserProjectProfile( profile ) )

        return this.actions$.pipe( ofActionCompleted( DeleteUserProjectProfile ) )
    }

    public createSupportProjectProfile (projectId: string): Observable<ActionCompletion<FetchCurrentUser>> {
        this.ngStore.dispatch( [
            new ResetSelectedProjectState(),
            new ResetMovementState(),
            new ResetActivityState(),
            new ResetCommunicationState(),
            new ResetParticipantState(),
            new ResetVehicleState(),
            new CreateSupportProjectProfile( projectId ),
        ] )

        return this.actions$.pipe( ofActionCompleted( FetchCurrentUser ) )
    }
}
