import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GroupModel } from '@shared/models/model/group.model'
import { GenericProjectElementStore } from '@shared/helpers/state/generic-project-element.store'
import { initialize } from '@shared/helpers/rx.helper'
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
import { StateHelper } from '@shared/helpers/state/state.helper'
import { inject, Injectable } from '@angular/core'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ErrorModel } from '@shared/models/model/error.model'
import { GroupStoreModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-store.model'

const defaultGroupStore: GroupStoreModel = {
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

@State<GroupStoreModel>( {
    name: 'group',
    defaults: defaultGroupStore,
} )
@Injectable()
export class GroupStore extends GenericProjectElementStore<GroupStoreModel> {
    private readonly api: GroupApi = inject( GroupApi )
    private readonly facade: GroupFacade = inject( GroupFacade )

    @Selector()
    public static groupsPage (state: GroupStoreModel): PageModel<GroupModel> | undefined {
        return state.groups.element
    }

    @Selector()
    public static groupsPageLoading (state: GroupStoreModel): boolean {
        return state.groups.loading
    }

    @Selector()
    public static groupsPageError (state: GroupStoreModel): ToastMessageOptions | undefined {
        return state.groups.error
    }

    @Selector()
    public static groupsPageSilentLoading (state: GroupStoreModel): boolean {
        return state.groups.silentLoading
    }

    @Selector()
    public static groupsPageResetSearch (state: GroupStoreModel): boolean {
        return state.groups.params.resetSearch
    }

    @Selector()
    public static groupsPageTextSearchedParam (state: GroupStoreModel): string | undefined {
        return state.groups.params.textSearched
    }

    @Selector()
    public static groupsPageDateTimeSearchedParam (state: GroupStoreModel): string | undefined {
        return state.groups.params.dateTimeSearched
    }

    @Selector()
    public static groupsPagePresenceSearchedParam (state: GroupStoreModel): boolean | undefined {
        return state.groups.params.presenceSearched
    }

    @Selector()
    public static groupsPageVisibilitySearchedParam (state: GroupStoreModel): boolean | undefined {
        return state.groups.params.visibilitySearched
    }

    @Selector()
    public static groupMembersPage (state: GroupStoreModel): PageModel<ParticipantModel> | undefined {
        return state.members.element
    }

    @Selector()
    public static groupMembersPageLoading (state: GroupStoreModel): boolean {
        return state.members.loading
    }

    @Selector()
    public static groupMembersPageError (state: GroupStoreModel): ToastMessageOptions | undefined {
        return state.members.error
    }

    @Selector()
    public static groupMembersPageSilentLoading (state: GroupStoreModel): boolean {
        return state.members.silentLoading
    }

    @Selector()
    public static groupMembersPageResetSearch (state: GroupStoreModel): boolean {
        return state.members.params.resetSearch
    }

    @Selector()
    public static groupMembersPageTextSearchedParam (state: GroupStoreModel): string | undefined {
        return state.members.params.textSearched
    }

    @Selector()
    public static groupMembersPageStatusSearchedParam (state: GroupStoreModel): string | undefined {
        return state.members.params.statusSearched
    }

    @Selector()
    public static groupMembersPageVisibilitySearchedParam (state: GroupStoreModel): boolean | undefined {
        return state.members.params.visibilitySearched
    }

    @Selector()
    public static searchedParticipantsMetadata (state: GroupStoreModel): SelectItem<ParticipantModel>[] {
        return state._metadata.searched
    }

    @Selector()
    public static availabilitiesMetadata (state: GroupStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.availabilities
    }

    @Selector()
    public static visibilitiesMetadata (state: GroupStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetGroupState )
    public resetGroupState (ctx: StateContext<GroupStoreModel>): void {
        ctx.setState( defaultGroupStore )
    }

    @Action( StartGroupsPageLoader )
    public startGroupsPageLoader (ctx: StateContext<GroupStoreModel>): void {
        ctx.patchState( {
            groups: StateHelper.updatePageLoader( ctx.getState().groups, true ),
        } )
    }

    @Action( StopGroupsPageLoader )
    public stopGroupsPageLoader (ctx: StateContext<GroupStoreModel>): void {
        ctx.patchState( {
            groups: StateHelper.updatePageLoader( ctx.getState().groups, false ),
        } )
    }

    @Action( FetchGroupsPage )
    public fetchGroupsPage (
        ctx: StateContext<GroupStoreModel>,
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
        ctx: StateContext<GroupStoreModel>,
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
        ctx: StateContext<GroupStoreModel>,
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
    public startGroupMembersPageLoader (ctx: StateContext<GroupStoreModel>): void {
        const requestInformation: GroupStoreModel['members'] = ctx.getState().members
        const page: PageModel<ParticipantModel> | undefined = requestInformation.element
        if (GenericHelper.isNull( page ) || page!.content?.length == 0) {
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
    public stopGroupMembersPageLoader (ctx: StateContext<GroupStoreModel>): void {
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
        ctx: StateContext<GroupStoreModel>,
        payload: FetchGroupMembersPage,
    ): Observable<void> {
        if (ctx.getState().members.groupId != payload.id) {
            ctx.patchState( {
                members: {
                    ...defaultGroupStore.members,
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
        ctx: StateContext<GroupStoreModel>,
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
        ctx: StateContext<GroupStoreModel>,
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
        ctx: StateContext<GroupStoreModel>,
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
        ctx: StateContext<GroupStoreModel>,
        participants: ParticipantModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searched: participants.map( (participant: ParticipantModel): SelectItem<ParticipantModel> =>
                    ParticipantHelper.toSelectItem( participant ),
                ),
            },
        } )
    }

    protected refreshPage (ctx: StateContext<GroupStoreModel>): void {
        const page: PageModel<GroupModel> | undefined = ctx.getState().groups.element
        this.facade.fetchGroupsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<GroupStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                groups: this.buildErrorMessage( ctx.getState().groups, error ),
            } )
        }

        return of()
    }

    protected memberPageError (ctx: StateContext<GroupStoreModel>, error: ErrorModel): Observable<void> {
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
