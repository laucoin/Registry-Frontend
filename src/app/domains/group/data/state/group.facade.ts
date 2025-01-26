import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { StateModel } from '../../../../shared/util-model/model/state.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { GroupDto } from '../dto/group.dto'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import {
    AddMembersToGroup,
    CreateGroup,
    DeleteGroup,
    DisableGroup,
    EnableGroup,
    FetchGroup,
    FetchGroupMembersPage,
    FetchGroupPage,
    InputGroupMemberPageDateRange,
    InputGroupMemberPageSearch,
    InputGroupPageDateRange,
    InputGroupPageSearch,
    RemoveMemberFromGroup,
    ResetGroup,
    SearchParticipants,
    SelectGroupMemberPageOrder,
    SelectGroupMemberPageVisibility,
    SelectGroupPageOrder,
    SelectGroupPageVisibility,
    StartGroupLoader,
    StartGroupMembersPageLoader,
    StartGroupsPageLoader,
    StopGroupLoader,
    StopGroupMembersPageLoader,
    StopGroupsPageLoader,
    UpdateGroup,
} from './group.action'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'

@Injectable()
export class GroupFacade extends GenericEventElementFacade<GroupModel> {
    public get page (): Observable<PageModel<GroupModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<GroupModel> | undefined => state.group.groups.element )
    }

    public get actualPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.group.groups.params.searched )
    }

    public get actualPageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => FormUtil.buildDateRange(
            state.group.groups.params.startDate,
            state.group.groups.params.endDate,
        ) )
    }

    public get actualPageOnlyVisible (): boolean {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean => state.group.groups.params.onlyVisible )
    }

    public get actualPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.group.groups.params.order )
    }

    public get pageLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.group.groups.loading )
    }

    public get pageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.group.groups.silentLoading )
    }

    public get pageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.group.groups.error )
    }

    public get memberPage (): Observable<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<ParticipantModel> | undefined => state.group.members.element )
    }

    public get actualMemberPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.group.members.params.searched )
    }

    public get actualMemberPageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => FormUtil.buildDateRange(
            state.group.members.params.startDate,
            state.group.members.params.endDate,
        ) )
    }

    public get actualMemberPageOnlyVisible (): boolean {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean => state.group.members.params.onlyVisible )
    }

    public get actualMemberPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.group.members.params.order )
    }

    public get memberPageLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.group.members.loading )
    }

    public get memberPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.group.members.silentLoading )
    }

    public get memberPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.group.members.error )
    }

    public get searchedParticipants (): Observable<SelectItem<ParticipantModel>[]> {
        return this.ngStore.select( (state: StateModel): SelectItem<ParticipantModel>[] => state.group._metadata.searched )
    }

    public get element (): Observable<GroupModel | undefined> {
        return this.ngStore.select( (state: StateModel): GroupModel | undefined => state.group.group.element )
    }

    public get elementLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.group.group.loading )
    }

    public startPageLoader (): void {
        this.ngStore.dispatch( StartGroupsPageLoader )
    }

    public stopPageLoader (): void {
        this.ngStore.dispatch( StopGroupsPageLoader )
    }

    public fetchElementPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchGroupPage( eventId, offset, limit, force ) )
    }

    public inputPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputGroupPageSearch( searched ) )
    }

    public inputPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputGroupPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectGroupPageVisibility( onlyVisible ) )
    }

    public selectPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectGroupPageOrder( order ) )
    }

    public startMemberPageLoader (): void {
        this.ngStore.dispatch( StartGroupMembersPageLoader )
    }

    public stopMemberPageLoader (): void {
        this.ngStore.dispatch( StopGroupMembersPageLoader )
    }

    public fetchMemberPage (
        id: string,
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchGroupMembersPage( eventId, id, offset, limit, force ) )
    }

    public inputMemberPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputGroupMemberPageSearch( searched ) )
    }

    public inputMemberPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputGroupMemberPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectMemberPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectGroupMemberPageVisibility( onlyVisible ) )
    }

    public selectMemberPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectGroupMemberPageOrder( order ) )
    }

    public startElementLoader (): void {
        this.ngStore.dispatch( StartGroupLoader )
    }

    public stopElementLoader (): void {
        this.ngStore.dispatch( StopGroupLoader )
    }

    public fetchElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchGroup( eventId, id ) )
    }

    public searchParticipants (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchParticipants( eventId, searched ) )
    }

    public resetElement (): void {
        this.ngStore.dispatch( ResetGroup )
    }

    public createElement (
        group: GroupDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateGroup> {
        this.ngStore.dispatch( new CreateGroup( eventId, group ) )
        return this.actions$.pipe( ofActionSuccessful( CreateGroup ) )
    }

    public updateElement (
        id: string,
        group: GroupDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateGroup> {
        this.ngStore.dispatch( new UpdateGroup( eventId, id, group ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateGroup ) )
    }

    public addMembersToGroup (
        groupId: string,
        memberIds: string[],
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<AddMembersToGroup> {
        this.ngStore.dispatch( new AddMembersToGroup( eventId, groupId, memberIds ) )

        return this.actions$.pipe( ofActionSuccessful( AddMembersToGroup ) )
    }

    public removeMemberFromGroup (
        groupId: string,
        participant: ParticipantModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new RemoveMemberFromGroup( eventId, groupId, participant ) )
    }

    public disableElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableGroup( eventId, id ) )
    }

    public enableElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableGroup( eventId, id ) )
    }

    public deleteElement (element: GroupModel, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DeleteGroup( eventId, element ) )
    }
}
