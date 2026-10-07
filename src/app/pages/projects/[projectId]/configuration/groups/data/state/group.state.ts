import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GroupModel } from '@shared/models/model/group.model'
import { GenericProjectElementState } from '@shared/helpers/state/generic-project-element.state'
import { initialize } from '@shared/helpers/util/rx.util'
import {
    FetchGroupMembersPage,
    FetchGroupsPage,
    ResetGroupState,
    SearchParticipants,
    StartGroupMembersPageLoader,
    StartGroupsPageLoader,
    StopGroupMembersPageLoader,
    StopGroupsPageLoader,
    UpdateGroupMembersPageSearchParams,
    UpdateGroupsPageSearchParams,
} from '@pages/projects/[projectId]/configuration/groups/data/state/group.action'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { StateUtil } from '@shared/helpers/state/state.util'
import { inject, Injectable } from '@angular/core'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantUtil } from '@shared/helpers/util/participant.util'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericUtil } from '@shared/helpers/util/generic.util'
import { ErrorModel } from '@shared/models/model/error.model'
import { GroupStateModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-state.model'

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
    private readonly api: GroupApi = inject( GroupApi )
    private readonly facade: GroupFacade = inject( GroupFacade )

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

    @Action( ResetGroupState )
    public resetGroupState (ctx: StateContext<GroupStateModel>): void {
        ctx.setState( defaultGroupState )
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
        return this.api.findGroups(
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

        return this.api.findGroupMembersByGroupId(
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

    @Action( SearchParticipants )
    public searchParticipants (
        ctx: StateContext<GroupStateModel>,
        payload: SearchParticipants,
    ): Observable<void> {
        return this.api.searchParticipants(
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

    protected refreshPage (ctx: StateContext<GroupStateModel>): void {
        const page: PageModel<GroupModel> | undefined = ctx.getState().groups.element
        this.facade.fetchGroupsPage( page?.pageNumber, page?.pageSize, true )
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
