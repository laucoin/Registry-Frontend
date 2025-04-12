import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
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
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { GroupState } from './group.state'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

@Injectable()
export class GroupFacade extends GenericEventElementFacade {
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
        return computed( (): boolean =>
            this.ngStore.selectSignal( GroupState.groupMembersPageLoading )() || this.registryFacade.contextEventLoading(),
        )
    }

    public get groupMembersPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageSilentLoading )
    }

    public get groupMembersPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( GroupState.groupMembersPageError )
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
        return computed( () =>
            this.ngStore.selectSignal( GroupState.groupLoading )() || this.registryFacade.contextEventLoading(),
        )
    }

    public get searchedParticipantsMetadata (): Signal<SelectItem<ParticipantModel>[]> {
        return this.ngStore.selectSignal( GroupState.searchedParticipantsMetadata )
    }

    public get presencesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
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

    public get availabilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( GroupState.availabilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
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
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchGroupsPage( eventId, pageNumber, pageSize, force ) )
    }

    public fetchGroupMembers (
        groupIds: string[],
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchGroupsMembers( eventId, groupIds ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        presenceSearched: boolean | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (textSearched !== this.groupMembersPageTextSearchedParam()) {
            this.ngStore.dispatch( new InputGroupsPageTextSearched( textSearched ) )
        }

        if (dateTimeSearched !== this.groupsPageDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputGroupsPageDateTimeSearched( dateTimeSearched ) )
        }

        if (presenceSearched !== this.groupsPagePresenceSearchedParam()) {
            this.ngStore.dispatch( new SelectGroupsPagePresenceSearched( presenceSearched ) )
        }

        if (visibilitySearched !== this.groupsPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectGroupsPageVisibilitySearched( visibilitySearched ) )
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
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchGroupMembersPage( eventId, id, pageNumber, pageSize, force ) )
    }

    public inputMembersPageSearchParameters (
        textSearched: string | undefined,
        statusSearched: string | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        if (textSearched !== this.groupMembersPageTextSearchedParam()) {
            this.ngStore.dispatch( new InputGroupMembersPageTextSearched( textSearched ) )
        }

        if (statusSearched !== this.groupMembersPageStatusSearchedParam()) {
            this.ngStore.dispatch( new SelectGroupMembersPageStatusSearched( statusSearched ) )
        }

        if (visibilitySearched !== this.groupMembersPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectGroupMembersPageVisibilitySearched( visibilitySearched ) )
        }
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
        textSearched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchParticipants( eventId, textSearched ) )
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
