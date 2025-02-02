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
    FetchGroupsPage,
    InputGroupMembersPageDateRange,
    InputGroupMembersPageSearch,
    InputGroupsPageDateRange,
    InputGroupsPageSearch,
    RemoveMemberFromGroup,
    ResetGroup,
    SearchParticipants,
    SelectGroupMembersPageOrder,
    SelectGroupMembersPageVisibility,
    SelectGroupsPageOrder,
    SelectGroupsPageVisibility,
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
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
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

const defaultGroup: ElementRequestInformationModel<GroupModel> = {
    element: undefined,
    loading: false,
}

const defaultGroupState: GroupStateModel = {
    groups: {
        element: undefined,
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            searched: undefined,
            isPresent: false,
            startDate: undefined,
            endDate: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    members: {
        element: undefined,
        groupId: undefined,
        params: {
            order: OrderEnum.ASC,
            onlyVisible: true,
            searched: undefined,
            isPresent: false,
            startDate: undefined,
            endDate: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    group: defaultGroup,
    _metadata: {
        searched: [],
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
    public static groupsPageSearchParam (state: GroupStateModel): string | undefined {
        return state.groups.params.searched
    }

    @Selector()
    public static groupsPageStartDateParam (state: GroupStateModel): string | undefined {
        return state.groups.params.startDate
    }

    @Selector()
    public static groupsPageEndDateParam (state: GroupStateModel): string | undefined {
        return state.groups.params.endDate
    }

    @Selector()
    public static groupsPageOnlyVisibleParam (state: GroupStateModel): boolean {
        return state.groups.params.onlyVisible
    }

    @Selector()
    public static groupsPageOrderParam (state: GroupStateModel): OrderEnum {
        return state.groups.params.order
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
    public static groupMembersPageSearchParam (state: GroupStateModel): string | undefined {
        return state.members.params.searched
    }

    @Selector()
    public static groupMembersPageStartDateParam (state: GroupStateModel): string | undefined {
        return state.members.params.startDate
    }

    @Selector()
    public static groupMembersPageEndDateParam (state: GroupStateModel): string | undefined {
        return state.members.params.endDate
    }

    @Selector()
    public static groupMembersPageOnlyVisibleParam (state: GroupStateModel): boolean {
        return state.members.params.onlyVisible
    }

    @Selector()
    public static groupMembersPageOrderParam (state: GroupStateModel): OrderEnum {
        return state.members.params.order
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
            payload.offset,
            payload.limit,
            ctx.getState().groups.params,
        ).pipe(
            initialize( (): void => this.facade.startGroupsPageLoader() ),
            finalize( (): void => this.facade.stopGroupsPageLoader() ),
            map( (groupPage: PageModel<GroupModel>): void => this.fetchGroupsPageComplete(
                ctx,
                groupPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchGroupsPageComplete (
        ctx: StateContext<GroupStateModel>,
        groupPage: PageModel<GroupModel>,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                element: groupPage,
            },
        } )
    }

    @Action( InputGroupsPageSearch )
    public inputGroupsPageSearch (
        ctx: StateContext<GroupStateModel>,
        payload: InputGroupsPageSearch,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputGroupsPageDateRange )
    public inputGroupsPageDateRange (
        ctx: StateContext<GroupStateModel>,
        payload: InputGroupsPageDateRange,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    startDate: payload.start?.toISOString(),
                    endDate: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectGroupsPageVisibility )
    public selectGroupsPageVisibility (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupsPageVisibility,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectGroupsPageOrder )
    public selectGroupsPageOrder (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupsPageOrder,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    order: payload.order,
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
            payload.offset,
            payload.limit,
            ctx.getState().groups.params,
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

    @Action( InputGroupMembersPageSearch )
    public inputGroupMembersPageSearch (
        ctx: StateContext<GroupStateModel>,
        payload: InputGroupMembersPageSearch,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: {
                    ...ctx.getState().members.params,
                    searched: payload.searched,
                },
            },
        } )
    }

    @Action( InputGroupMembersPageDateRange )
    public inputGroupMembersPageDateRange (
        ctx: StateContext<GroupStateModel>,
        payload: InputGroupMembersPageDateRange,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: {
                    ...ctx.getState().members.params,
                    startDate: payload.start?.toISOString(),
                    endDate: payload.end?.toISOString(),
                },
            },
        } )
    }

    @Action( SelectGroupMembersPageVisibility )
    public selectGroupMembersPageVisibility (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupMembersPageVisibility,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: {
                    ...ctx.getState().members.params,
                    onlyVisible: payload.onlyVisible,
                },
            },
        } )
    }

    @Action( SelectGroupMembersPageOrder )
    public selectGroupMembersPageOrder (
        ctx: StateContext<GroupStateModel>,
        payload: SelectGroupMembersPageOrder,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: {
                    ...ctx.getState().members.params,
                    order: payload.order,
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
            payload.searched,
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
            'success.title.group.create',
            'success.message.group.create',
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
            'success.title.group.edit',
            'success.message.group.edit',
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
            const message: string = 'warning.message.group.add-members.'
            this.buildMessageAndNotify(
                'warn',
                'warning.title.group.add-members',
                members.length <= 1 ? `${message}singular` : `${message}plural`,
                'pi pi-user-plus',
                {
                    asked: asked,
                    added: members.length,
                },
            )
        } else {
            const title: string = 'success.title.group.add-members.'
            const message: string = 'success.message.group.add-members.'
            this.buildMessageAndNotify(
                'success',
                members?.length <= 1 ? `${title}singular` : `${title}plural`,
                members?.length <= 1 ? `${message}singular` : `${message}plural`,
                'pi pi-user-plus',
                {
                    created: members.length,
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
            'success.title.group.remove-member',
            'success.message.group.remove-member',
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
            'success.title.group.disable',
            'success.message.group.disable',
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
            'success.title.group.enable',
            'success.message.group.enable',
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
            'success.title.group.delete',
            'success.message.group.delete',
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
        this.facade.fetchGroupsPage( page?.offset, page?.limit, true, eventId )
    }

    protected refreshGroupMembers (ctx: StateContext<GroupStateModel>, eventId: string | undefined): void {
        const pageInformation: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> & {
            groupId: string | undefined
        } = ctx.getState().members
        this.facade.fetchGroupMembersPage(
            pageInformation.groupId!,
            pageInformation.element?.offset,
            pageInformation.element?.limit,
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
