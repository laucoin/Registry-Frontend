import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import {
    BlockEventProfile,
    CreateEventProfiles,
    CreateSupportEventProfile,
    DeleteEventProfile,
    FetchAssignableEventProfileRoles,
    FetchAssignableEventProfileStatus,
    FetchEventProfile,
    FetchEventProfilesPage,
    InputEventProfilesPageDateRange,
    InputEventProfilesPageSearch,
    SearchUsers,
    SelectEventProfilesPageOrder,
    SelectEventProfilesPageStatus,
    SelectEventProfilesPageVisibility,
    StartEventProfileLoader,
    StartEventProfilesPageLoader,
    StopEventProfileLoader,
    StopEventProfilesPageLoader,
    UnblockEventProfile,
    UpdateEventProfile,
} from './event-profile.action'
import { EventProfileService } from './event-profile.service'
import { EventProfileFacade } from './event-profile.facade'
import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { DatePipe } from '@angular/common'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { CreatedEventProfiles } from '../dto/created-event-profiles.dto'
import { UserUtil } from '../../../../shared/util-tool/util/user.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { EventProfileStateModel } from '../model/event-profile-state.model'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'

const defaultEventProfileState: EventProfileStateModel = {
    eventProfiles: {
        element: undefined,
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            onlyUsable: false,
            status: undefined,
            searched: undefined,
            startAccess: undefined,
            endAccess: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    eventProfile: {
        element: undefined,
        loading: false,
    },
    _metadata: {
        roles: [],
        status: [],
        searched: [],
    },
}

@State<EventProfileStateModel>( {
    name: 'eventProfile',
    defaults: defaultEventProfileState,
} )
@Injectable()
export class EventProfileState extends GenericEventElementState<EventProfileStateModel> {
    private readonly eventProfileIcon: string = 'pi pi-key'

    public constructor (
        private readonly service: EventProfileService,
        private readonly facade: EventProfileFacade,
        private readonly translateService: TranslateService,
        private readonly datePipe: DatePipe,
    ) {
        super()
    }

    @Selector()
    public static eventProfilesPage (state: EventProfileStateModel): PageModel<EventProfileModel> | undefined {
        return state.eventProfiles.element
    }

    @Selector()
    public static eventProfilesPageLoading (state: EventProfileStateModel): boolean {
        return state.eventProfiles.loading
    }

    @Selector()
    public static eventProfilesPageError (state: EventProfileStateModel): ToastMessageOptions | undefined {
        return state.eventProfiles.error
    }

    @Selector()
    public static eventProfilesPageSilentLoading (state: EventProfileStateModel): boolean {
        return state.eventProfiles.silentLoading
    }

    @Selector()
    public static eventProfilesPageSearchParam (state: EventProfileStateModel): string | undefined {
        return state.eventProfiles.params.searched
    }

    @Selector()
    public static eventProfilesPageStatusParam (state: EventProfileStateModel): string | undefined {
        return state.eventProfiles.params.status
    }

    @Selector()
    public static eventProfilesPageStartAccessParam (state: EventProfileStateModel): string | undefined {
        return state.eventProfiles.params.startAccess
    }

    @Selector()
    public static eventProfilesPageEndAccessParam (state: EventProfileStateModel): string | undefined {
        return state.eventProfiles.params.endAccess
    }

    @Selector()
    public static eventProfilesPageOnlyVisibleParam (state: EventProfileStateModel): boolean {
        return state.eventProfiles.params.onlyVisible
    }

    @Selector()
    public static eventProfilesPageOrderParam (state: EventProfileStateModel): OrderEnum {
        return state.eventProfiles.params.order
    }

    @Selector()
    public static eventProfile (state: EventProfileStateModel): EventProfileModel | undefined {
        return state.eventProfile.element
    }

    @Selector()
    public static eventProfileLoading (state: EventProfileStateModel): boolean {
        return state.eventProfile.loading
    }

    @Selector()
    public static searchedUsersMetadata (state: EventProfileStateModel): SelectItem<UserModel>[] {
        return state._metadata.searched
    }

    @Selector()
    public static eventProfileAssignableRolesMetadata (state: EventProfileStateModel): SelectItem<string>[] {
        return state._metadata.roles
    }

    @Selector()
    public static eventProfilesStatusMetadata (state: EventProfileStateModel): SelectItem<string>[] {
        return state._metadata.status
    }

    @Action( StartEventProfilesPageLoader )
    public startEventProfilesPageLoader (ctx: StateContext<EventProfileStateModel>): void {
        ctx.patchState( {
            eventProfiles: StateUtil.updatePageLoader( ctx.getState().eventProfiles, true ),
        } )
    }

    @Action( StopEventProfilesPageLoader )
    public stopEventProfilesPageLoader (ctx: StateContext<EventProfileStateModel>): void {
        ctx.patchState( {
            eventProfiles: StateUtil.updatePageLoader( ctx.getState().eventProfiles, false ),
        } )
    }

    @Action( FetchEventProfilesPage )
    public fetchEventProfilesPage (
        ctx: StateContext<EventProfileStateModel>,
        payload: FetchEventProfilesPage,
    ): Observable<void> {
        return this.service.findEventProfiles(
            payload.eventId,
            payload.offset,
            payload.limit,
            ctx.getState().eventProfiles.params,
        ).pipe(
            initialize( (): void => this.facade.startEventProfilesPageLoader() ),
            finalize( (): void => this.facade.stopEventProfilesPageLoader() ),
            map( (profilePage: PageModel<EventProfileModel>): void => this.fetchEventProfilesPageComplete(
                ctx,
                profilePage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchEventProfilesPageComplete (
        ctx: StateContext<EventProfileStateModel>,
        profilePage: PageModel<EventProfileModel>,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                element: profilePage,
            },
        } )
    }

    @Action( InputEventProfilesPageSearch )
    public inputEventProfilesPageSearch (
        ctx: StateContext<EventProfileStateModel>,
        payload: InputEventProfilesPageSearch,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputEventProfilesPageDateRange )
    public inputEventProfilesPageDateRange (
        ctx: StateContext<EventProfileStateModel>,
        payload: InputEventProfilesPageDateRange,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    startAccess: payload.begin?.toISOString(),
                    endAccess: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectEventProfilesPageStatus )
    public selectEventProfilesPageStatus (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilesPageStatus,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    status: payload.status,
                },
            },
        } )
    }

    @Action( SelectEventProfilesPageVisibility )
    public selectEventProfilesPageVisibility (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilesPageVisibility,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectEventProfilesPageOrder )
    public selectEventProfilesPageOrder (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilesPageOrder,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    order: payload.order,
                },
            },
        } )
    }

    @Action( StartEventProfileLoader )
    public startEventProfileLoader (ctx: StateContext<EventProfileStateModel>): void {
        ctx.patchState( {
            eventProfile: StateUtil.updateElementLoader( ctx.getState().eventProfile, true ),
        } )
    }

    @Action( StopEventProfileLoader )
    public stopEventProfileLoader (ctx: StateContext<EventProfileStateModel>): void {
        ctx.patchState( {
            eventProfile: StateUtil.updateElementLoader( ctx.getState().eventProfile, false ),
        } )
    }

    @Action( FetchEventProfile )
    public fetchEventProfile (ctx: StateContext<EventProfileStateModel>, payload: FetchEventProfile): Observable<void> {
        return this.service.findEventProfileById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (profile: EventProfileModel): void => this.fetchEventProfileComplete( ctx, profile ) ),
        )
    }

    private fetchEventProfileComplete (
        ctx: StateContext<EventProfileStateModel>,
        profile: EventProfileModel,
    ): void {
        ctx.patchState( {
            eventProfile: {
                ...ctx.getState().eventProfile,
                element: profile,
            },
        } )
    }

    @Action( SearchUsers )
    public SearchUsers (
        ctx: StateContext<EventProfileStateModel>,
        payload: SearchUsers,
    ): Observable<void> {
        return this.service.searchUsers(
            payload.eventId,
            payload.searched,
        ).pipe(
            map( (users: UserModel[]): void => this.searchUsersComplete(
                ctx,
                users,
            ) ),
        )
    }

    private searchUsersComplete (
        ctx: StateContext<EventProfileStateModel>,
        users: UserModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searched: users.map( (user: UserModel): SelectItem<UserModel> => UserUtil.toSelectItem( user ) ),
            },
        } )
    }

    @Action( FetchAssignableEventProfileRoles )
    public fetchAssignableEventProfileRoles (
        ctx: StateContext<EventProfileStateModel>,
        payload: FetchAssignableEventProfileRoles,
    ): Observable<void> {
        return this.service.getAssignableEventProfileRoles( payload.eventId ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (roles: SelectItem<string>[]): void => this.fetchAssignableEventProfileRolesComplete( ctx, roles ) ),
        )
    }

    private fetchAssignableEventProfileRolesComplete (
        ctx: StateContext<EventProfileStateModel>,
        roles: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                roles: roles,
            },
        } )
    }

    @Action( FetchAssignableEventProfileStatus )
    public fetchAssignableEventProfileStatus (
        ctx: StateContext<EventProfileStateModel>,
        payload: FetchAssignableEventProfileStatus,
    ): Observable<void> {
        return this.service.getAvailableEventProfileStatus( payload.eventId ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (status: SelectItem<string>[]): void => this.fetchAssignableEventProfileStatusComplete(
                ctx,
                status,
            ) ),
        )
    }

    private fetchAssignableEventProfileStatusComplete (
        ctx: StateContext<EventProfileStateModel>,
        status: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                status: status,
            },
        } )
    }

    @Action( CreateEventProfiles )
    public createEventProfiles (
        ctx: StateContext<EventProfileStateModel>,
        payload: CreateEventProfiles,
    ): Observable<void> {
        return this.service.createEventProfiles( payload.eventId, payload.profiles ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (creationStatus: CreatedEventProfiles): void => this.createEventProfilesComplete(
                ctx,
                payload.eventId,
                creationStatus,
            ) ),
        )
    }

    private createEventProfilesComplete (
        ctx: StateContext<EventProfileStateModel>,
        eventId: string | undefined,
        creationStatus: CreatedEventProfiles,
    ): void {
        if (creationStatus?.notCreatedUserIds.length > 0) {
            const message: string = 'warning.message.event-profile.create.'
            this.buildMessageAndNotify(
                'warn',
                'warning.title.event-profile.create',
                creationStatus?.createdUserIds?.length <= 1 ? `${message}singular` : `${message}plural`,
                this.eventProfileIcon,
                {
                    asked: creationStatus.createdUserIds.length + creationStatus.notCreatedUserIds.length,
                    created: creationStatus.createdUserIds.length,
                },
            )
        } else {
            const title: string = 'success.title.event-profile.create.normal.'
            const message: string = 'success.message.event-profile.create.normal.'
            this.buildMessageAndNotify(
                'success',
                creationStatus.createdUserIds?.length <= 1 ? `${title}singular` : `${title}plural`,
                creationStatus.createdUserIds?.length <= 1 ? `${message}singular` : `${message}plural`,
                this.eventProfileIcon,
                {
                    created: creationStatus.createdUserIds.length,
                },
            )
        }
        this.refreshPage( ctx, eventId )
    }

    @Action( UpdateEventProfile )
    public updateEventProfile (
        ctx: StateContext<EventProfileStateModel>,
        payload: UpdateEventProfile,
    ): Observable<void> {
        return this.service.updateEventProfileById( payload.eventId, payload.id, payload.profile ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (): void => this.updateEventProfileComplete( ctx, payload.eventId ) ),
        )
    }

    private updateEventProfileComplete (
        ctx: StateContext<EventProfileStateModel>,
        eventId: string | undefined,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event-profile.edit',
            'success.message.event-profile.edit',
            this.eventProfileIcon,
            this.buildTranslationArgs( ctx.getState().eventProfile.element! ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( CreateSupportEventProfile )
    public createSupportEventProfile (
        ctx: StateContext<EventProfileStateModel>,
        payload: CreateSupportEventProfile,
    ): Observable<void> {
        return this.service.createSupportEventProfile( payload.eventId ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (profile: EventProfileModel): void => this.createSupportEventProfileComplete(
                ctx,
                payload.eventId,
                profile,
            ) ),
        )
    }

    private createSupportEventProfileComplete (
        ctx: StateContext<EventProfileStateModel>,
        eventId: string | undefined,
        profile: EventProfileModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event-profile.create.support',
            'success.message.event-profile.create.support',
            this.eventProfileIcon,
            {
                name: profile?.event?.name,
                end: this.datePipe.transform(
                    profile?.endAccess,
                    this.translateService.instant( 'datetime.format.date' ),
                ),
            },
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( BlockEventProfile )
    public disableEventProfile (
        ctx: StateContext<EventProfileStateModel>,
        payload: BlockEventProfile,
    ): Observable<void> {
        return this.service.blockEventProfileById( payload.eventId, payload.profile.id ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (): void => this.blockEventProfileComplete( ctx, payload.eventId, payload.profile ) ),
        )
    }

    private blockEventProfileComplete (
        ctx: StateContext<EventProfileStateModel>,
        eventId: string | undefined,
        profile: EventProfileModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event-profile.block',
            'success.message.event-profile.block',
            this.eventProfileIcon,
            this.buildTranslationArgs( profile ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( UnblockEventProfile )
    public enableEventProfile (
        ctx: StateContext<EventProfileStateModel>,
        payload: UnblockEventProfile,
    ): Observable<void> {
        return this.service.unblockEventProfileById( payload.eventId, payload.profile.id ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (): void => this.unblockEventProfileComplete( ctx, payload.eventId, payload.profile ) ),
        )
    }

    private unblockEventProfileComplete (
        ctx: StateContext<EventProfileStateModel>,
        eventId: string | undefined,
        profile: EventProfileModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event-profile.unblock',
            'success.message.event-profile.unblock',
            this.eventProfileIcon,
            this.buildTranslationArgs( profile ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DeleteEventProfile )
    public deleteEventProfile (
        ctx: StateContext<EventProfileStateModel>,
        payload: DeleteEventProfile,
    ): Observable<void> {
        return this.service.deleteEventProfileById( undefined, payload.profile.id ).pipe(
            initialize( (): void => this.facade.startEventProfileLoader() ),
            finalize( (): void => this.facade.stopEventProfileLoader() ),
            map( (): void => this.deleteEventProfileComplete( ctx, payload.eventId, payload.profile ) ),
        )
    }

    private deleteEventProfileComplete (
        ctx: StateContext<EventProfileStateModel>,
        eventId: string | undefined,
        profile: EventProfileModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'success.title.event-profile.delete',
            'success.message.event-profile.delete.someone',
            this.eventProfileIcon,
            this.buildTranslationArgs( profile ),
        )
        this.refreshPage( ctx, eventId )
    }

    private buildTranslationArgs (profile: EventProfileModel): object {
        return {
            firstName: profile?.user?.firstName,
            lastName: profile?.user?.lastName,
            name: profile?.event?.name,
        }
    }

    protected refreshPage (ctx: StateContext<EventProfileStateModel>, eventId: string | undefined): void {
        const page: PageModel<EventProfileModel> | undefined = ctx.getState().eventProfiles.element
        this.facade.fetchEventProfilesPage( page?.offset, page?.limit, true, eventId )
    }

    protected pageError (ctx: StateContext<EventProfileStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                eventProfiles: this.buildErrorMessage( ctx.getState().eventProfiles, error ),
            } )
        }

        return of()
    }
}
