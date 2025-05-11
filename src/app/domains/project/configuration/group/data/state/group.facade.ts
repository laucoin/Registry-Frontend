import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { GenericProjectElementFacade } from '../../../../../../shared/util-tool/facade/generic-project-element.facade'
import { GroupDto } from '../dto/group.dto'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
import {
    AddMembersToGroup,
    CreateGroup,
    DeleteGroup,
    DisableGroup,
    EnableGroup,
    FetchGroup,
    FetchGroupMembersPage,
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
import { ParticipantModel } from '../../../../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../../../../shared/util-model/model/group.model'
import { GroupState } from './group.state'
import { DateUtil } from '../../../../../../shared/util-tool/util/date.util'

@Injectable()
export class GroupFacade extends GenericProjectElementFacade {
    public get groupsPage (): Signal<PageModel<GroupModel> | undefined> {
        return this.ngStore.selectSignal( GroupState.groupsPage )
    }

    public get groupsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupsPageLoading )
    }

    public get groupsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupsPageSilentLoading )
    }

    public get groupsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( GroupState.groupsPageError )
    }

    public get groupsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupsPageResetSearch )
    }

    public get groupsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( GroupState.groupsPageTextSearchedParam )
    }

    public get groupsPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( () =>
            DateUtil.buildDate( this.ngStore.selectSignal( GroupState.groupsPageDateTimeSearchedParam )() ),
        )
    }

    public get groupsPagePresenceSearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( GroupState.groupsPagePresenceSearchedParam )
    }

    public get groupsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( GroupState.groupsPageVisibilitySearchedParam )
    }

    public get groupMembersPage (): Signal<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.selectSignal( GroupState.groupMembersPage )
    }

    public get groupMembersPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageLoading )
    }

    public get groupMembersPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageSilentLoading )
    }

    public get groupMembersPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageError )
    }

    public get groupMembersPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageResetSearch )
    }

    public get groupMembersPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageTextSearchedParam )
    }

    public get groupMembersPageStatusSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageStatusSearchedParam )
    }

    public get groupMembersPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageVisibilitySearchedParam )
    }

    public get group (): Signal<GroupModel | undefined> {
        return this.ngStore.selectSignal( GroupState.group )
    }

    public get group$ (): Observable<GroupModel | undefined> {
        return this.ngStore.select( GroupState.group )
    }

    public get groupLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupLoading )
    }

    public get searchedParticipantsMetadata (): Signal<SelectItem<ParticipantModel>[]> {
        return this.ngStore.selectSignal( GroupState.searchedParticipantsMetadata )
    }

    public get availabilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( GroupState.availabilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( GroupState.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public startGroupsPageLoader (): void {
        this.ngStore.dispatch( StartGroupsPageLoader )
    }

    public stopGroupsPageLoader (): void {
        this.ngStore.dispatch( StopGroupsPageLoader )
    }

    public fetchGroupsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.groupsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchGroupsPage( this.selectedProjectId(), index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        presenceSearched: boolean | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.groupsPageTextSearchedParam() != textSearched
                                     || this.groupsPagePresenceSearchedParam() != presenceSearched
                                     || this.groupsPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.groupsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateGroupsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                presenceSearched: presenceSearched,
                visibilitySearched: visibilitySearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startGroupMembersPageLoader (): void {
        this.ngStore.dispatch( StartGroupMembersPageLoader )
    }

    public stopGroupMembersPageLoader (): void {
        this.ngStore.dispatch( StopGroupMembersPageLoader )
    }

    public fetchGroupMembersPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.groupMembersPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchGroupMembersPage( this.selectedProjectId(), id, index, pageSize, force ) )
    }

    public inputMembersPageSearchParameters (
        textSearched: string | undefined,
        statusSearched: string | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.groupMembersPageTextSearchedParam() != textSearched
                                     || this.groupMembersPageStatusSearchedParam() != statusSearched
                                     || this.groupMembersPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateGroupMembersPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                statusSearched: statusSearched,
                textSearched: textSearched,
            } ) )
        }
    }

    public addMembersToGroup (
        id: string,
        memberIds: string[],
    ): Observable<AddMembersToGroup> {
        this.ngStore.dispatch( new AddMembersToGroup( this.selectedProjectId(), id, memberIds ) )

        return this.actions$.pipe( ofActionSuccessful( AddMembersToGroup ) )
    }

    public removeMemberFromGroup (
        id: string,
        participant: ParticipantModel,
    ): void {
        this.ngStore.dispatch( new RemoveMemberFromGroup( this.selectedProjectId(), id, participant ) )
    }

    public startGroupLoader (): void {
        this.ngStore.dispatch( StartGroupLoader )
    }

    public stopGroupLoader (): void {
        this.ngStore.dispatch( StopGroupLoader )
    }

    public fetchGroup (id: string): void {
        this.ngStore.dispatch( new FetchGroup( this.selectedProjectId(), id ) )
    }

    public searchParticipants (
        textSearched: string | undefined = undefined,
    ): void {
        this.ngStore.dispatch( new SearchParticipants( this.selectedProjectId(), textSearched ) )
    }

    public resetGroup (): void {
        this.ngStore.dispatch( ResetGroup )
    }

    public createGroup (
        group: GroupDto,
    ): Observable<CreateGroup> {
        this.ngStore.dispatch( new CreateGroup( this.selectedProjectId(), group ) )
        return this.actions$.pipe( ofActionSuccessful( CreateGroup ) )
    }

    public updateGroup (
        id: string,
        group: GroupDto,
    ): Observable<UpdateGroup> {
        this.ngStore.dispatch( new UpdateGroup( this.selectedProjectId(), id, group ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateGroup ) )
    }

    public disableGroup (
        id: string,
    ): void {
        this.ngStore.dispatch( new DisableGroup( this.selectedProjectId(), id ) )
    }

    public enableGroup (
        id: string,
    ): void {
        this.ngStore.dispatch( new EnableGroup( this.selectedProjectId(), id ) )
    }

    public deleteGroup (
        group: GroupModel,
    ): void {
        this.ngStore.dispatch( new DeleteGroup( this.selectedProjectId(), group ) )
    }
}
