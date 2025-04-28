import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { GroupModel } from '../../../../../../shared/util-model/model/group.model'
import { GenericProjectElementState } from '../../../../../../shared/util-tool/state/generic-project-element.state'
import { initialize } from '../../../../../../shared/util-tool/util/rx.util'
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
    RemoveMemberFromGroup,
    ResetGroup,
    SearchParticipants,
    StartGroupLoader,
    StartGroupMembersPageLoader,
    StartGroupsPageLoader,
    StopGroupLoader,
    StopGroupMembersPageLoader,
    StopGroupsPageLoader,
    UpdateGroup,
    UpdateGroupMembersPageSearchParams,
    UpdateGroupsPageSearchParams,
} from './group.action'
import { GroupService } from './group.service'
import { GroupFacade } from './group.facade'
import { StateUtil } from '../../../../../../shared/util-tool/state/state.util'
import { Injectable } from '@angular/core'
import {
    ElementRequestInformationModel,
} from '../../../../../../shared/util-model/model/element-request-information.model'
import { ParticipantModel } from '../../../../../../shared/util-model/model/participant.model'
import { ParticipantUtil } from '../../../../../../shared/util-tool/util/participant.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericUtil } from '../../../../../../shared/util-tool/util/generic.util'
import { AddedGroupMembersDto } from '../../../../../../shared/util-model/dto/added-group-members.dto'
import { PageRequestInformationModel } from '../../../../../../shared/util-model/model/page-request-information.model'
import { ParticipantPageParamsModel } from '../../../participant/data/model/participant-page-params.model'
import { ErrorModel } from '../../../../../../shared/util-model/model/error.model'
import { GroupStateModel } from '../model/group-state.model'
import { PairModel } from '../../../../../../shared/util-model/model/pair.model'
import { GroupUtil } from '../../../../../../shared/util-tool/util/group.util'
import { PluralTranslationPipe } from '../../../../../../shared/util-tool/pipe/plural-translation.pipe'
import { SeverityEnum } from '../../../../../../shared/util-model/enumeration/severity.enum'

const defaultGroup: ElementRequestInformationModel<GroupModel> = {
    element: undefined,
    loading: false,
}

const defaultGroupState: GroupStateModel = {
    groups: {
        element: undefined,
        params: {
            resetSearch: false,
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
            resetSearch: false,
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
export class GroupState extends GenericProjectElementState<GroupStateModel> {
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
    public static groupsPageResetSearch (state: GroupStateModel): boolean {
        return state.groups.params.resetSearch
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
    public static groupMembersPageResetSearch (state: GroupStateModel): boolean {
        return state.members.params.resetSearch
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
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().groups.params,
        ).pipe(
            initialize( (): void => this.facade.startGroupsPageLoader() ),
            finalize( (): void => this.facade.stopGroupsPageLoader() ),
            map( (groupsPage: PageModel<GroupModel>): void => this.fetchGroupsPageComplete(
                ctx,
                groupsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchGroupsPageComplete (
        ctx: StateContext<GroupStateModel>,
        groupsPage: PageModel<GroupModel>,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: {
                    ...ctx.getState().groups.params,
                    resetSearch: false,
                },
                element: groupsPage,
            },
        } )

        if (groupsPage.content.length > 0) {
            this.facade.fetchGroupMembers(
                groupsPage.content.map( (group: GroupModel): string => group.id ),
            )
        }
    }

    @Action( FetchGroupsMembers )
    public fetchGroupsMembers (
        ctx: StateContext<GroupStateModel>,
        payload: FetchGroupsMembers,
    ): Observable<void> {
        return this.service.findGroupsMembers(
            payload.projectId,
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

    @Action( UpdateGroupsPageSearchParams )
    public updateGroupsPageSearchParams (
        ctx: StateContext<GroupStateModel>,
        payload: UpdateGroupsPageSearchParams,
    ): void {
        ctx.patchState( {
            groups: {
                ...ctx.getState().groups,
                params: payload.params,
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
            payload.projectId,
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
                params: {
                    ...ctx.getState().members.params,
                    resetSearch: false,
                },
                element: membersPage,
            },
        } )
    }

    @Action( UpdateGroupMembersPageSearchParams )
    public updateGroupMembersPageSearchParams (
        ctx: StateContext<GroupStateModel>,
        payload: UpdateGroupMembersPageSearchParams,
    ): void {
        ctx.patchState( {
            members: {
                ...ctx.getState().members,
                params: payload.params,
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
        return this.service.findGroupById( payload.projectId, payload.id ).pipe(
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
            payload.projectId,
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
        return this.service.createGroup( payload.projectId, payload.group ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.createGroupComplete(
                ctx,
                group,
            ) ),
        )
    }

    private createGroupComplete (
        ctx: StateContext<GroupStateModel>,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'groups.notifications.create.title',
            'groups.notifications.create.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx )
    }

    @Action( UpdateGroup )
    public updateGroup (ctx: StateContext<GroupStateModel>, payload: UpdateGroup): Observable<void> {
        return this.service.updateGroupById( payload.projectId, payload.id, payload.group ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.updateGroupComplete(
                ctx,
                group,
            ) ),
        )
    }

    private updateGroupComplete (
        ctx: StateContext<GroupStateModel>,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'groups.notifications.edit.title',
            'groups.notifications.edit.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx )
    }

    @Action( AddMembersToGroup )
    public addMembersToGroup (ctx: StateContext<GroupStateModel>, payload: AddMembersToGroup): Observable<void> {
        return this.service.addMembersToGroupById( payload.projectId, payload.id, payload.memberIds ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (response: AddedGroupMembersDto): void => this.addMembersToGroupComplete(
                ctx,
                payload.memberIds.length,
                response.members,
            ) ),
        )
    }

    private addMembersToGroupComplete (
        ctx: StateContext<GroupStateModel>,
        asked: number,
        members: string[],
    ): void {
        if (asked != members.length) {
            const prefixKey: string = 'groups.notifications.partial-add-member'
            this.buildMessageAndNotify(
                SeverityEnum.WARNING,
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
                SeverityEnum.SUCCESS,
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
        this.refreshGroupMembers( ctx )
    }

    @Action( RemoveMemberFromGroup )
    public removeMemberFromGroup (
        ctx: StateContext<GroupStateModel>,
        payload: RemoveMemberFromGroup,
    ): Observable<void> {
        return this.service.removeMemberFromGroupById( payload.projectId, payload.id, payload.participant.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.removeMemberFromGroupComplete(
                ctx,
                group,
                payload.participant,
            ) ),
        )
    }

    private removeMemberFromGroupComplete (
        ctx: StateContext<GroupStateModel>,
        group: GroupModel,
        participant: ParticipantModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'groups.notifications.remove-member.title',
            'groups.notifications.remove-member.message',
            'pi pi-user-minus',
            {
                ...this.buildTranslationArgs( group ),
                firstName: participant.firstName,
                lastName: participant.lastName,
            },
        )
        this.refreshGroupMembers( ctx )
    }

    @Action( DisableGroup )
    public disableGroup (
        ctx: StateContext<GroupStateModel>,
        payload: DisableGroup,
    ): Observable<void> {
        return this.service.disableGroupById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.disableGroupComplete(
                ctx,
                group,
            ) ),
        )
    }

    private disableGroupComplete (
        ctx: StateContext<GroupStateModel>,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'groups.notifications.disable.title',
            'groups.notifications.disable.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx )
    }

    @Action( EnableGroup )
    public enableGroup (ctx: StateContext<GroupStateModel>, payload: EnableGroup): Observable<void> {
        return this.service.enableGroupById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (group: GroupModel): void => this.enableGroupComplete(
                ctx,
                group,
            ) ),
        )
    }

    private enableGroupComplete (
        ctx: StateContext<GroupStateModel>,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'groups.notifications.enable.title',
            'groups.notifications.enable.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx )
    }

    @Action( DeleteGroup )
    public deleteGroup (ctx: StateContext<GroupStateModel>, payload: DeleteGroup): Observable<void> {
        return this.service.deleteGroupById( undefined, payload.group.id ).pipe(
            initialize( (): void => this.facade.startGroupLoader() ),
            finalize( (): void => this.facade.stopGroupLoader() ),
            map( (): void => this.deleteGroupComplete(
                ctx,
                payload.group,
            ) ),
        )
    }

    private deleteGroupComplete (
        ctx: StateContext<GroupStateModel>,
        group: GroupModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            'groups.notifications.delete.title',
            'groups.notifications.delete.message',
            this.groupIcon,
            this.buildTranslationArgs( group ),
        )
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (group: GroupModel): object {
        return { name: group?.name }
    }

    protected refreshPage (ctx: StateContext<GroupStateModel>): void {
        const page: PageModel<GroupModel> | undefined = ctx.getState().groups.element
        this.facade.fetchGroupsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected refreshGroupMembers (ctx: StateContext<GroupStateModel>): void {
        const pageInformation: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> & {
            groupId: string | undefined
        } = ctx.getState().members
        this.facade.fetchGroupMembersPage(
            pageInformation.groupId!,
            pageInformation.element?.pageNumber,
            pageInformation.element?.pageSize,
            true,
        )
        this.facade.fetchGroup( pageInformation.groupId! )
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
