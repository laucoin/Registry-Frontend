import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import {
    BlockEventProfile,
    CreateEventProfiles,
    DeleteEventProfile,
    FetchAssignableEventProfileRoles,
    FetchEventProfile,
    FetchEventProfilesPage,
    FetchProfileStatus,
    InputEventProfilesPageDateTimeSearched,
    InputEventProfilesPageTextSearched,
    ResetEventProfile,
    SearchUsers,
    SelectEventProfilesPageAvailabilitySearched,
    SelectEventProfilesPageStatusSearched,
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
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { CreatedEventProfiles } from '../dto/created-event-profiles.dto'
import { UserUtil } from '../../../../shared/util-tool/util/user.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { EventProfileStateModel } from '../model/event-profile-state.model'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { PluralTranslationPipe } from '../../../../shared/util-tool/pipe/plural-translation.pipe'
import { MetadataService } from '../../../../shared/util-common/state/metadata.service'

const defaultEventProfile: ElementRequestInformationModel<EventProfileModel> = {
    element: undefined,
    loading: false,
}

const defaultEventProfileState: EventProfileStateModel = {
    eventProfiles: {
        element: undefined,
        params: {
            availabilitySearched: undefined,
            statusSearched: undefined,
            textSearched: undefined,
            dateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    eventProfile: defaultEventProfile,
    _metadata: {
        roles: [],
        status: [],
        searched: [],
        availabilities: [
            { label: '-', value: undefined },
            { label: 'event-profiles.visible.true', value: true },
            { label: 'event-profiles.visible.false', value: false },
        ],
    },
}

@State<EventProfileStateModel>( {
    name: 'eventProfile',
    defaults: defaultEventProfileState,
} )
@Injectable()
export class EventProfileState extends GenericEventElementState<EventProfileStateModel> implements NgxsOnInit {
    private readonly eventProfileIcon: string = 'pi pi-key'

    public constructor (
        private readonly service: EventProfileService,
        private readonly serviceMetadata: MetadataService,
        private readonly facade: EventProfileFacade,
        private readonly pluralTranslationPipe: PluralTranslationPipe,
    ) {
        super()
    }

    public ngxsOnInit (): void {
        this.facade.fetchProfileStatus()
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
    public static eventProfilesPageTextSearchedParam (state: EventProfileStateModel): string | undefined {
        return state.eventProfiles.params.textSearched
    }

    @Selector()
    public static eventProfilesPageStatusSearchedParam (state: EventProfileStateModel): string | undefined {
        return state.eventProfiles.params.statusSearched
    }

    @Selector()
    public static eventProfilesPageDateTimeSearchedParam (state: EventProfileStateModel): string | undefined {
        return state.eventProfiles.params.dateTimeSearched
    }

    @Selector()
    public static eventProfilesPageAvailabilitySearchedParam (state: EventProfileStateModel): boolean | undefined {
        return state.eventProfiles.params.availabilitySearched
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
    public static eventProfilesStatusMetadata (state: EventProfileStateModel): SelectItem<string | undefined>[] {
        return state._metadata.status
    }

    @Selector()
    public static eventProfilesAvailabilitiesMetadata (state: EventProfileStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
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
            payload.pageNumber,
            payload.pageSize,
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

    @Action( InputEventProfilesPageTextSearched )
    public inputEventProfilesPageTextSearched (
        ctx: StateContext<EventProfileStateModel>,
        payload: InputEventProfilesPageTextSearched,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    textSearched: payload.textSearched,
                },
            },
        } )
    }

    @Action( InputEventProfilesPageDateTimeSearched )
    public inputEventProfilesPageDateTimeSearched (
        ctx: StateContext<EventProfileStateModel>,
        payload: InputEventProfilesPageDateTimeSearched,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    dateTimeSearched: payload.dateTime?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectEventProfilesPageStatusSearched )
    public selectEventProfilesPageStatusSearched (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilesPageStatusSearched,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    statusSearched: payload.statusSearched,
                },
            },
        } )
    }

    @Action( SelectEventProfilesPageAvailabilitySearched )
    public selectEventProfilesPageAvailabilitySearched (
        ctx: StateContext<EventProfileStateModel>,
        payload: SelectEventProfilesPageAvailabilitySearched,
    ): void {
        ctx.patchState( {
            eventProfiles: {
                ...ctx.getState().eventProfiles,
                params: {
                    ...ctx.getState().eventProfiles.params,
                    availabilitySearched: payload.availabilitySearched,
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

    @Action( ResetEventProfile )
    public resetEventProfile (ctx: StateContext<EventProfileStateModel>): void {
        ctx.patchState( {
            eventProfile: defaultEventProfile,
        } )
    }

    @Action( SearchUsers )
    public SearchUsers (
        ctx: StateContext<EventProfileStateModel>,
        payload: SearchUsers,
    ): Observable<void> {
        return this.service.searchUsers(
            payload.eventId,
            payload.textSearched,
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

    @Action( FetchProfileStatus )
    public fetchProfileStatus (
        ctx: StateContext<EventProfileStateModel>,
    ): Observable<void> {
        return this.serviceMetadata.getProfilesStatus().pipe(
            map( (status: SelectItem<string>[]): void => this.fetchProfileStatusComplete(
                ctx,
                status,
            ) ),
        )
    }

    private fetchProfileStatusComplete (
        ctx: StateContext<EventProfileStateModel>,
        status: SelectItem<string>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                status: [
                    { label: '-', value: undefined },
                    ...status,
                ],
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
            const prefixKey: string = 'event-profiles.notifications.partial-invitation'
            this.buildMessageAndNotify(
                'warn',
                this.pluralTranslationPipe.transform(
                    prefixKey + '.title',
                    creationStatus.createdUserIds.length,
                ),
                this.pluralTranslationPipe.transform(
                    prefixKey + '.message',
                    creationStatus.createdUserIds.length,
                ),
                this.eventProfileIcon,
                {
                    asked: creationStatus.createdUserIds.length + creationStatus.notCreatedUserIds.length,
                    created: creationStatus.createdUserIds.length,
                },
            )
        } else {
            this.buildMessageAndNotify(
                'success',
                this.pluralTranslationPipe.transform(
                    'event-profiles.notifications.create.title',
                    creationStatus.createdUserIds,
                ),
                this.pluralTranslationPipe.transform(
                    'event-profiles.notifications.create.message',
                    creationStatus.createdUserIds,
                ),
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
            'event-profiles.notifications.edit.title',
            'event-profiles.notifications.edit.message',
            this.eventProfileIcon,
            this.buildTranslationArgs( ctx.getState().eventProfile.element! ),
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
            'event-profiles.notifications.disable.title',
            'event-profiles.notifications.disable.message',
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
            'event-profiles.notifications.enable.title',
            'event-profiles.notifications.enable.message',
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
            'event-profiles.notifications.delete.title',
            'event-profiles.notifications.delete.message.other',
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
        this.facade.fetchEventProfilesPage( page?.pageNumber, page?.pageSize, true, eventId )
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
