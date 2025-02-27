import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GenericEventElementState } from '../../../../shared/util-tool/state/generic-event-element.state'
import { initialize } from '../../../../shared/util-tool/util/rx.util'
import {
    AddMembersToGroup,
    CreateGroup,
    DeleteGroup,
    DisableGroup,
    EnableGroup,
    FetchGroup,
    FetchGroupMembersPage,
    FetchGroupsMembers,
    FetchGroupsPage,
    InputGroupMembersPageTextSearched,
    InputGroupsPageDateTimeSearched,
    InputGroupsPageTextSearched,
    RemoveMemberFromGroup,
    ResetGroup,
    SearchParticipants,
    SelectGroupMembersPageStatusSearched,
    SelectGroupMembersPageVisibilitySearched,
    SelectGroupsPagePresenceSearched,
    SelectGroupsPageVisibilitySearched,
    StartGroupLoader,
    StartGroupMembersPageLoader,
    StartGroupsPageLoader,
    StopGroupLoader,
    StopGroupMembersPageLoader,
    StopGroupsPageLoader,
    UpdateGroup,
} from './group.action'
import { GroupService } from './group.service'
import { GroupFacade } from './group.facade'
import { StateUtil } from '../../../../shared/util-tool/state/state.util'
import { Injectable } from '@angular/core'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantUtil } from '../../../../shared/util-tool/util/participant.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { AddedGroupMembersDto } from '../../../../shared/util-model/dto/added-group-members.dto'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ParticipantPageParamsModel } from '../../../participant/data/model/participant-page-params.model'
import { ErrorModel } from '../../../../shared/util-model/model/error.model'
import { GroupStateModel } from '../model/group-state.model'
import { PairModel } from '../../../../shared/util-model/model/pair.model'
import { GroupUtil } from '../../../../shared/util-tool/util/group.util'
import { PluralTranslationPipe } from '../../../../shared/util-tool/pipe/plural-translation.pipe'

const defaultGroup: ElementRequestInformationModel<GroupModel> = {
    element: undefined,
    loading: false,
}

const defaultGroupState: GroupStateModel = {
    groups: {
        element: undefined,
        params: {
            textSearched: undefined,
            visibilitySearched: undefined,
            presenceSearched: undefined,
            dateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    members: {
        element: undefined,
        groupId: undefined,
        params: {
            visibilitySearched: undefined,
            statusSearched: undefined,
            textSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    group: defaultGroup,
    _metadata: {
        searched: [],
        availabilities: [
            { label: '-', value: undefined },
            { label: 'groups.available.true', value: true },
            { label: 'groups.available.false', value: false },
        ],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'groups.visible.true', value: true },
            { label: 'groups.visible.false', value: false },
        ],
    },
}

@State<GroupStateModel>( {
    name: 'group',
    defaults: defaultGroupState,
} )
@Injectable()
export class GroupState extends GenericEventElementState<GroupStateModel> {
    private readonly groupIcon: string = 'pi pi-users'

    public constructor (
        private readonly service: GroupService,
        private readonly facade: GroupFacade,
        private readonly pluralTranslationPipe: PluralTranslationPipe,
    ) {
        super()
    }

    @Selector()
    public static groupsPage (state: GroupStateModel): PageModel<GroupModel> | undefined {
        return state.groups.element
    }

    @Selector()
    public static groupsPageLoading (state: GroupStateModel): boolean {
        return state.groups.loading
    }

    @Selector()
    public static groupsPageError (state: GroupStateModel): ToastMessageOptions | undefined {
        return state.groups.error
    }

    @Selector()
    public static groupsPageSilentLoading (state: GroupStateModel): boolean {
        return state.groups.silentLoading
    }

    @Selector()
    public static groupsPageTextSearchedParam (state: GroupStateModel): string | undefined {
        return state.groups.params.textSearched
    }

    @Selector()
    public static groupsPageDateTimeSearchedParam (state: GroupStateModel): string | undefined {
        return state.groups.params.dateTimeSearched
    }

    @Selector()
    public static groupsPagePresenceSearchedParam (state: GroupStateModel): boolean | undefined {
        return state.groups.params.presenceSearched
    }

    @Selector()
    public static groupsPageVisibilitySearchedParam (state: GroupStateModel): boolean | undefined {
        return state.groups.params.visibilitySearched
    }

    @Selector()
    public static groupMembersPage (state: GroupStateModel): PageModel<ParticipantModel> | undefined {
        return state.members.element
    }

    @Selector()
    public static groupMembersPageLoading (state: GroupStateModel): boolean {
        return state.members.loading
    }

    @Selector()
    public static groupMembersPageError (state: GroupStateModel): ToastMessageOptions | undefined {
        return state.members.error
    }

    @Selector()
    public static groupMembersPageSilentLoading (state: GroupStateModel): boolean {
        return state.members.silentLoading
    }

    @Selector()
    public static groupMembersPageTextSearchedParam (state: GroupStateModel): string | undefined {
        return state.members.params.textSearched
    }

    @Selector()
    public static groupMembersPageStatusSearchedParam (state: GroupStateModel): string | undefined {
        return state.members.params.statusSearched
    }

    @Selector()
    public static groupMembersPageVisibilitySearchedParam (state: GroupStateModel): boolean | undefined {
        return state.members.params.visibilitySearched
    }

    @Selector()
    public static group (state: GroupStateModel): GroupModel | undefined {
        return state.group.element
    }

    @Selector()
    public static groupLoading (state: GroupStateModel): boolean {
        return state.group.loading
    }

    @Selector()
    public static searchedParticipantsMetadata (state: GroupStateModel): SelectItem<ParticipantModel>[] {
        return state._metadata.searched
    }

    @Selector()
    public static availabilitiesMetadata (state: GroupStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Selector()
    public static visibilitiesMetadata (state: GroupStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( StartGroupsPageLoader )
    public startGroupsPageLoader (ctx: StateContext<GroupStateModel>): void {
        ctx.patchState( {
            groups: StateUtil.updatePageLoader( ctx.getState().groups, true ),
        } )
    }

    @Action( StopGroupsPageLoader )
    public stopGroupsPageLoader (ctx: StateContext<GroupStateModel>): void {
        ctx.patchState( {
            groups: StateUtil.updatePageLoader( ctx.getState().groups, false ),
        } )
    }

    @Action( FetchGroupsPage )
    public fetchGroupsPage (
        ctx: StateContext<GroupStateModel>,
        payload: FetchGroupsPage,
    ): Observable<void> {
        return this.service.findGroups(
            payload.eventId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().groups.params,
        ).pipe(
            initialize( (): void => this.facade.startGroupsPageLoader() ),
            finalize( (): void => this.facade.stopGroupsPageLoader() ),
            map( (groupsPage: PageModel<GroupModel>): void => this.fetchGroupsPageComplete(
                ctx,
                payload.eventId,
                groupsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchGroupsPageComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        groupsPage: PageModel<GroupModel>,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                element: groupsPage,
            },
        } )

        if (groupsPage.content.length > 0) {
            this.facade.fetchGroupMembers(
                groupsPage.content.map( (group: GroupModel): string => group.id ),
                eventId,
            )
        }
    }

    @Action( FetchGroupsMembers )
    public fetchGroupsMembers (
        ctx: StateContext<GroupStateModel>,
        payload: FetchGroupsMembers,
    ): Observable<void> {
        return this.service.findGroupsMembers(
            payload.eventId,
            payload.groupIds,
        ).pipe(
            map( (contents: PairModel<ParticipantModel[]>[]): void => this.fetchGroupsMembersComplete(
                ctx,
                contents,
            ) ),
        )
    }

    private fetchGroupsMembersComplete (
        ctx: StateContext<GroupStateModel>,
        members: PairModel<ParticipantModel[]>[],
    ): void {
        if (!ctx.getState().groups.element) {
            return
        }

        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                element: {
                    ...ctx.getState().groups.element!,
                    content: GroupUtil.rebuildPageWithMembers( ctx.getState().groups.element!.content, members ),
                },
            },
        } )
    }

    @Action( InputGroupsPageTextSearched )
    public inputGroupsPageTextSearched (
        ctx: StateContext<GroupStateModel>,
        payload: InputGroupsPageTextSearched,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    textSearched: payload.searched,
                },
            },
        } )
    }

    @Action( InputGroupsPageDateTimeSearched )
    public inputGroupsPageDateTimeSearched (
        ctx: StateContext<GroupStateModel>,
        payload: InputGroupsPageDateTimeSearched,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    dateTimeSearched: payload.dateTimeSearched?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectGroupsPagePresenceSearched )
    public selectGroupsPagePresenceSearched (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupsPagePresenceSearched,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    presenceSearched: payload.presenceSearched,
                },
            },
        } )
    }

    @Action( SelectGroupsPageVisibilitySearched )
    public selectGroupsPageVisibilitySearched (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupsPageVisibilitySearched,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    visibilitySearched: payload.visibilitySearched,
                },
            },
        } )
    }

    @Action( StartGroupMembersPageLoader )
    public startGroupMembersPageLoader (ctx: StateContext<GroupStateModel>): void {
        const requestInformation: GroupStateModel['members'] = ctx.getState().members
        const page: PageModel<ParticipantModel> | undefined = requestInformation.element
        if (GenericUtil.isNull( page ) || page!.content?.length == 0) {
            ctx.patchState( {
                members: {
                    ...requestInformation,
                    loading: true,
                },
            } )
        } else {
            ctx.patchState( {
                members: {
                    ...requestInformation,
                    silentLoading: true,
                },
            } )
        }
    }

    @Action( StopGroupMembersPageLoader )
    public stopGroupMembersPageLoader (ctx: StateContext<GroupStateModel>): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                loading: false,
                silentLoading: false,
            },
        } )
    }

    @Action( FetchGroupMembersPage )
    public fetchGroupMembersPage (
        ctx: StateContext<GroupStateModel>,
        payload: FetchGroupMembersPage,
    ): Observable<void> {
        if (ctx.getState().members.groupId != payload.id) {
            ctx.patchState( {
                members: {
                    ...defaultGroupState.members,
                    groupId: payload.id,
                },
            } )
        }

        return this.service.findGroupMembersByGroupId(
            payload.eventId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().members.params,
        ).pipe(
            initialize( (): void => this.facade.startGroupMembersPageLoader() ),
            finalize( (): void => this.facade.stopGroupMembersPageLoader() ),
            map( (membersPage: PageModel<ParticipantModel>): void => this.fetchGroupMembersPageComplete(
                ctx,
                membersPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.memberPageError( ctx, error ) ),
        )
    }

    private fetchGroupMembersPageComplete (
        ctx: StateContext<GroupStateModel>,
        membersPage: PageModel<ParticipantModel>,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                element: membersPage,
            },
        } )
    }

    @Action( InputGroupMembersPageTextSearched )
    public inputGroupMembersPageTextSearched (
        ctx: StateContext<GroupStateModel>,
        payload: InputGroupMembersPageTextSearched,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: {
                    ...ctx.getState().members.params,
                    textSearched: payload.textSearched,
                },
            },
        } )
    }

    @Action( SelectGroupMembersPageStatusSearched )
    public selectGroupMembersPageStatusSearched (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupMembersPageStatusSearched,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: {
                    ...ctx.getState().members.params,
                    statusSearched: payload.statusSearched,
                },
            },
        } )
    }

    @Action( SelectGroupMembersPageVisibilitySearched )
    public selectGroupMembersPageVisibilitySearched (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupMembersPageVisibilitySearched,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: {
                    ...ctx.getState().members.params,
                    visibilitySearched: payload.visibilitySearched,
                },
            },
        } )
    }

    @Action( StartGroupLoader )
    public startGroupLoader (ctx: StateContext<GroupStateModel>): void {
        ctx.patchState( {
            group: StateUtil.updateElementLoader( ctx.getState().group, true ),
        } )
    }

    @Action( StopGroupLoader )
    public stopGroupLoader (ctx: StateContext<GroupStateModel>): void {
        ctx.patchState( {
            group: StateUtil.updateElementLoader( ctx.getState().group, false ),
        } )
    }

    @Action( FetchGroup )
    public fetchGroup (ctx: StateContext<GroupStateModel>, payload: FetchGroup): Observable<void> {
        return this.service.findGroupById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.fetchGroupComplete( ctx, group ) ),
        )
    }

    private fetchGroupComplete (
        ctx: StateContext<GroupStateModel>,
        group: GroupModel,
    ): void {
        ctx.patchState( {
            group: {
                ...ctx.getState().group,
                element: group,
            },
        } )
    }

    @Action( SearchParticipants )
    public searchParticipants (
        ctx: StateContext<GroupStateModel>,
        payload: SearchParticipants,
    ): Observable<void> {
        return this.service.searchParticipants(
            payload.eventId,
            payload.textSearched,
        ).pipe(
            map( (participants: ParticipantModel[]): void => this.searchParticipantsComplete(
                ctx,
                participants,
            ) ),
        )
    }

    private searchParticipantsComplete (
        ctx: StateContext<GroupStateModel>,
        participants: ParticipantModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searched: participants.map( (participant: ParticipantModel): SelectItem<ParticipantModel> =>
                    ParticipantUtil.toSelectItem( participant ),
                ),
            },
        } )
    }

    @Action( ResetGroup )
    public resetGroup (ctx: StateContext<GroupStateModel>): void {
        ctx.patchState( {
            group: defaultGroup,
        } )
    }

    @Action( CreateGroup )
    public createGroup (ctx: StateContext<GroupStateModel>, payload: CreateGroup): Observable<void> {
        return this.service.createGroup( payload.eventId, payload.group ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.createGroupComplete(
                ctx,
                payload.eventId,
                group,
            ) ),
        )
    }

    private createGroupComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'groups.notifications.create.title',
            'groups.notifications.create.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( UpdateGroup )
    public updateGroup (ctx: StateContext<GroupStateModel>, payload: UpdateGroup): Observable<void> {
        return this.service.updateGroupById( payload.eventId, payload.id, payload.group ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.updateGroupComplete(
                ctx,
                payload.eventId,
                group,
            ) ),
        )
    }

    private updateGroupComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'groups.notifications.edit.title',
            'groups.notifications.edit.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( AddMembersToGroup )
    public addMembersToGroup (ctx: StateContext<GroupStateModel>, payload: AddMembersToGroup): Observable<void> {
        return this.service.addMembersToGroupById( payload.eventId, payload.id, payload.memberIds ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (response: AddedGroupMembersDto): void => this.addMembersToGroupComplete(
                ctx,
                payload.eventId,
                payload.memberIds.length,
                response.members,
            ) ),
        )
    }

    private addMembersToGroupComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        asked: number,
        members: string[],
    ): void {
        if (asked != members.length) {
            const prefixKey: string = 'groups.notifications.partial-add-member'
            this.buildMessageAndNotify(
                'warn',
                this.pluralTranslationPipe.transform(
                    prefixKey + '.title',
                    members.length,
                ),
                this.pluralTranslationPipe.transform(
                    prefixKey + '.message',
                    members.length,
                ),
                'pi pi-user-plus',
                {
                    asked: asked,
                    added: members.length,
                },
            )
        } else {
            const prefixKey: string = 'groups.notifications.add-member'
            this.buildMessageAndNotify(
                'success',
                this.pluralTranslationPipe.transform(
                    prefixKey + '.title',
                    members.length,
                ),
                this.pluralTranslationPipe.transform(
                    prefixKey + '.message',
                    members.length,
                ),
                'pi pi-user-plus',
                {
                    added: members.length,
                },
            )
        }
        this.refreshGroupMembers( ctx, eventId )
    }

    @Action( RemoveMemberFromGroup )
    public removeMemberFromGroup (
        ctx: StateContext<GroupStateModel>,
        payload: RemoveMemberFromGroup,
    ): Observable<void> {
        return this.service.removeMemberFromGroupById( payload.eventId, payload.id, payload.participant.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.removeMemberFromGroupComplete(
                ctx,
                payload.eventId,
                group,
                payload.participant,
            ) ),
        )
    }

    private removeMemberFromGroupComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        group: GroupModel,
        participant: ParticipantModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'groups.notifications.remove-member.title',
            'groups.notifications.remove-member.message',
            'pi pi-user-minus',
            {
                ...this.buildTranslationArgs( group ),
                firstName: participant.firstName,
                lastName: participant.lastName,
            },
        )
        this.refreshGroupMembers( ctx, eventId )
    }

    @Action( DisableGroup )
    public disableGroup (
        ctx: StateContext<GroupStateModel>,
        payload: DisableGroup,
    ): Observable<void> {
        return this.service.disableGroupById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.disableGroupComplete(
                ctx,
                payload.eventId,
                group,
            ) ),
        )
    }

    private disableGroupComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'groups.notifications.disable.title',
            'groups.notifications.disable.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( EnableGroup )
    public enableGroup (ctx: StateContext<GroupStateModel>, payload: EnableGroup): Observable<void> {
        return this.service.enableGroupById( payload.eventId, payload.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.enableGroupComplete(
                ctx,
                payload.eventId,
                group,
            ) ),
        )
    }

    private enableGroupComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'groups.notifications.enable.title',
            'groups.notifications.enable.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx, eventId )
    }

    @Action( DeleteGroup )
    public deleteGroup (ctx: StateContext<GroupStateModel>, payload: DeleteGroup): Observable<void> {
        return this.service.deleteGroupById( undefined, payload.group.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (): void => this.deleteGroupComplete(
                ctx,
                payload.eventId,
                payload.group,
            ) ),
        )
    }

    private deleteGroupComplete (
        ctx: StateContext<GroupStateModel>,
        eventId: string | undefined,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            'success',
            'groups.notifications.delete.title',
            'groups.notifications.delete.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx, eventId )
    }

    private buildTranslationArgs (group: GroupModel): object {
        return { name: group?.name }
    }

    protected refreshPage (ctx: StateContext<GroupStateModel>, eventId: string | undefined): void {
        const page: PageModel<GroupModel> | undefined = ctx.getState().groups.element
        this.facade.fetchGroupsPage( page?.pageNumber, page?.pageSize, true, eventId )
    }

    protected refreshGroupMembers (ctx: StateContext<GroupStateModel>, eventId: string | undefined): void {
        const pageInformation: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> & {
            groupId: string | undefined
        } = ctx.getState().members
        this.facade.fetchGroupMembersPage(
            pageInformation.groupId!,
            pageInformation.element?.pageNumber,
            pageInformation.element?.pageSize,
            true,
            eventId,
        )
        this.facade.fetchGroup( pageInformation.groupId!, eventId )
    }

    protected pageError (ctx: StateContext<GroupStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                groups: this.buildErrorMessage( ctx.getState().groups, error ),
            } )
        }

        return of()
    }

    protected memberPageError (ctx: StateContext<GroupStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                members: {
                    groupId: ctx.getState().members.groupId,
                    ...this.buildErrorMessage( ctx.getState().members, error ),
                },
            } )
        }
        return of()
    }
}
