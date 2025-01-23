import { Action, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import { EventProfileStateModel } from '../model/event-profile-state.model'
import {
    BlockEventProfile,
    CreateEventProfiles,
    CreateSupportEventProfile,
    DeleteEventProfile,
    FetchAssignableEventProfileRoles,
    FetchAssignableEventProfileStatus,
    FetchEventProfile,
    FetchEventProfilePage,
    InputEventProfilePageDateRange,
    InputEventProfilePageSearch,
    SearchUsers,
    SelectEventProfilePageOrder,
    SelectEventProfilePageStatus,
    SelectEventProfilePageVisibility,
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
import { SelectItem } from 'primeng/api'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'

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

    @Action( FetchEventProfilePage )
    public fetchEventProfilePage (
        ctx: StateContext<EventProfileStateModel>,
        payload: FetchEventProfilePage,
    ): Observable<void> {
        return this.service.findEventProfiles(
            payload.eventId,
            payload.offset,
            payload.limit,
            ctx.getState().eventProfiles.params,
        ).pipe(
            initialize( (): void => this.facade.startPageLoader() ),
            finalize( (): void => this.facade.stopPageLoader() ),
            map( (profilePage: PageModel<EventProfileModel>): void => this.fetchEventProfilePageComplete(
                ctx,
                profilePage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchEventProfilePageComplete (
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

    @Action( InputEventProfilePageSearch )
    public inputEventProfilePageSearch (
        ctx: StateContext<EventProfileStateModel>,
        payload: InputEventProfilePageSearch,
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

    @Action( InputEventProfilePageDateRange )
    public inputEventProfilePageDateRange (
        ctx: StateContext<EventProfileStateModel>,
        payload: InputEventProfilePageDateRange,
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

    @Action( SelectEventProfilePageStatus )
    public selectEventProfilePageStatus (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilePageStatus,
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

    @Action( SelectEventProfilePageVisibility )
    public selectEventProfilePageVisibility (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilePageVisibility,
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

    @Action( SelectEventProfilePageOrder )
    public selectEventProfilePageOrder (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilePageOrder,
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

    @Action( FetchEventProfile )
    public fetchEventProfile (ctx: StateContext<EventProfileStateModel>, payload: FetchEventProfile): Observable<void> {
        return this.service.findEventProfileById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
    public createEventProfile (
        ctx: StateContext<EventProfileStateModel>,
        payload: CreateEventProfiles,
    ): Observable<void> {
        return this.service.createEventProfiles( payload.eventId, payload.profiles ).pipe(
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
            initialize( (): void => this.facade.startElementLoader() ),
            finalize( (): void => this.facade.stopElementLoader() ),
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
        this.facade.fetchElementPage( page?.offset, page?.limit, true, eventId )
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
