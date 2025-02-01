import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { GroupDto } from '../dto/group.dto'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
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
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GroupState } from './group.state'

@Injectable()
export class GroupFacade extends GenericEventElementFacade {
    public get groupsPage (): Observable<PageModel<GroupModel> | undefined> {
        return this.ngStore.select( GroupState.groupsPage )
    }

    public get groupsPageLoading (): Observable<boolean> {
        return this.ngStore.select( GroupState.groupsPageLoading )
    }

    public get groupsPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( GroupState.groupsPageSilentLoading )
    }

    public get groupsPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( GroupState.groupsPageError )
    }

    public get actualGroupsPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( GroupState.groupsPageSearchParam )
    }

    public get actualGroupsPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( GroupState.groupsPageStartDateParam ),
            this.ngStore.selectSnapshot( GroupState.groupsPageEndDateParam ),
        )
    }

    public get actualGroupsPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( GroupState.groupsPageOnlyVisibleParam )
    }

    public get actualGroupsPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( GroupState.groupsPageOrderParam )
    }

    public get groupMembersPage (): Observable<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.select( GroupState.groupMembersPage )
    }

    public get groupMembersPageLoading (): Observable<boolean> {
        return this.ngStore.select( GroupState.groupMembersPageLoading )
    }

    public get groupMembersPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( GroupState.groupMembersPageSilentLoading )
    }

    public get groupMembersPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( GroupState.groupMembersPageError )
    }

    public get actualGroupMembersPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( GroupState.groupMembersPageSearchParam )
    }

    public get actualGroupMembersPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( GroupState.groupMembersPageStartDateParam ),
            this.ngStore.selectSnapshot( GroupState.groupMembersPageEndDateParam ),
        )
    }

    public get actualGroupMembersPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( GroupState.groupMembersPageOnlyVisibleParam )
    }

    public get actualGroupMembersPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( GroupState.groupMembersPageOrderParam )
    }

    public get group (): Observable<GroupModel | undefined> {
        return this.ngStore.select( GroupState.group )
    }

    public get groupLoading (): Observable<boolean> {
        return this.ngStore.select( GroupState.groupLoading )
    }

    public get searchedParticipantsMetadata (): Observable<SelectItem<ParticipantModel>[]> {
        return this.ngStore.select( GroupState.searchedParticipantsMetadata )
    }

    public startGroupsPageLoader (): void {
        this.ngStore.dispatch( StartGroupsPageLoader )
    }

    public stopGroupsPageLoader (): void {
        this.ngStore.dispatch( StopGroupsPageLoader )
    }

    public fetchGroupsPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchGroupsPage( eventId, offset, limit, force ) )
    }

    public inputGroupsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputGroupsPageSearch( searched ) )
    }

    public inputGroupsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputGroupsPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectGroupsPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectGroupsPageVisibility( onlyVisible ) )
    }

    public selectGroupsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectGroupsPageOrder( order ) )
    }

    public startGroupMembersPageLoader (): void {
        this.ngStore.dispatch( StartGroupMembersPageLoader )
    }

    public stopGroupMembersPageLoader (): void {
        this.ngStore.dispatch( StopGroupMembersPageLoader )
    }

    public fetchGroupMembersPage (
        id: string,
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchGroupMembersPage( eventId, id, offset, limit, force ) )
    }

    public inputGroupMembersPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputGroupMembersPageSearch( searched ) )
    }

    public inputGroupMembersPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputGroupMembersPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectGroupMembersPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectGroupMembersPageVisibility( onlyVisible ) )
    }

    public selectGroupMembersPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectGroupMembersPageOrder( order ) )
    }

    public addMembersToGroup (
        id: string,
        memberIds: string[],
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<AddMembersToGroup> {
        this.ngStore.dispatch( new AddMembersToGroup( eventId, id, memberIds ) )
        return this.actions$.pipe( ofActionSuccessful( AddMembersToGroup ) )
    }

    public removeMemberFromGroup (
        id: string,
        participant: ParticipantModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<RemoveMemberFromGroup> {
        this.ngStore.dispatch( new RemoveMemberFromGroup( eventId, id, participant ) )
        return this.actions$.pipe( ofActionSuccessful( RemoveMemberFromGroup ) )
    }

    public startGroupLoader (): void {
        this.ngStore.dispatch( StartGroupLoader )
    }

    public stopGroupLoader (): void {
        this.ngStore.dispatch( StopGroupLoader )
    }

    public fetchGroup (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchGroup( eventId, id ) )
    }

    public searchParticipants (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchParticipants( eventId, searched ) )
    }

    public resetGroup (): void {
        this.ngStore.dispatch( ResetGroup )
    }

    public createGroup (
        group: GroupDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateGroup> {
        this.ngStore.dispatch( new CreateGroup( eventId, group ) )
        return this.actions$.pipe( ofActionSuccessful( CreateGroup ) )
    }

    public handleGroupCreation (): Observable<CreateGroup> {
        return this.actions$.pipe( ofActionSuccessful( CreateGroup ) )
    }

    public updateGroup (
        id: string,
        group: GroupDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateGroup> {
        this.ngStore.dispatch( new UpdateGroup( eventId, id, group ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateGroup ) )
    }

    public disableGroup (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableGroup( eventId, id ) )
    }

    public enableGroup (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableGroup( eventId, id ) )
    }

    public deleteGroup (
        group: GroupModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new DeleteGroup( eventId, group ) )
    }
}
