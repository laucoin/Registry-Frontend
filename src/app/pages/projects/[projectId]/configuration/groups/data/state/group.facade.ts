import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import {
    FetchGroupMembersPage,
    FetchGroupsPage,
    SearchParticipants,
    StartGroupMembersPageLoader,
    StartGroupsPageLoader,
    StopGroupMembersPageLoader,
    StopGroupsPageLoader,
    UpdateGroupMembersPageSearchParams,
    UpdateGroupsPageSearchParams,
} from '@pages/projects/[projectId]/configuration/groups/data/state/group.action'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GroupModel } from '@shared/models/model/group.model'
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store'
import { DateHelper } from '@shared/helpers/date.helper'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { AddedGroupMembersDto } from '@shared/models/dto/added-group-members.dto'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'

@Injectable()
export class GroupFacade extends GenericProjectElementFacade {
    private readonly api: GroupApi = inject( GroupApi )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    public get groupsPage (): Signal<PageModel<GroupModel> | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupsPage )
    }

    public get groupsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupStore.groupsPageLoading )
    }

    public get groupsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupStore.groupsPageSilentLoading )
    }

    public get groupsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupsPageError )
    }

    public get groupsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupStore.groupsPageResetSearch )
    }

    public get groupsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupsPageTextSearchedParam )
    }

    public get groupsPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( () =>
            DateHelper.buildDate( this.ngStore.selectSignal( GroupStore.groupsPageDateTimeSearchedParam )() ),
        )
    }

    public get groupsPagePresenceSearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupsPagePresenceSearchedParam )
    }

    public get groupsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupsPageVisibilitySearchedParam )
    }

    public get groupMembersPage (): Signal<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPage )
    }

    public get groupMembersPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPageLoading )
    }

    public get groupMembersPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPageSilentLoading )
    }

    public get groupMembersPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPageError )
    }

    public get groupMembersPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPageResetSearch )
    }

    public get groupMembersPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPageTextSearchedParam )
    }

    public get groupMembersPageStatusSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPageStatusSearchedParam )
    }

    public get groupMembersPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( GroupStore.groupMembersPageVisibilitySearchedParam )
    }

    public get searchedParticipantsMetadata (): Signal<SelectItem<ParticipantModel>[]> {
        return this.ngStore.selectSignal( GroupStore.searchedParticipantsMetadata )
    }

    public get availabilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( GroupStore.availabilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( GroupStore.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
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

    public searchParticipants (
        textSearched: string | undefined = undefined,
    ): void {
        this.ngStore.dispatch( new SearchParticipants( this.selectedProjectId(), textSearched ) )
    }

    public fetchGroup (id: string): Observable<GroupModel> {
        return this.api.findGroupById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createGroup (group: GroupDto): Observable<GroupModel> {
        return this.api.createGroup( this.selectedProjectId(), group ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: GroupModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateGroup (id: string, group: GroupDto): Observable<GroupModel> {
        return this.api.updateGroupById( this.selectedProjectId(), id, group ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: GroupModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableGroup (id: string): Observable<GroupModel> {
        return this.api.disableGroupById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: GroupModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableGroup (id: string): Observable<GroupModel> {
        return this.api.enableGroupById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: GroupModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteGroup (group: GroupModel): Observable<void> {
        return this.api.deleteGroupById( undefined, group.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', group ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, group: GroupModel): void {
        this.onCommandSucceeded( 'group', command, 'groups.notifications', 'pi pi-users', { name: group?.name } )

        const page: PageModel<GroupModel> | undefined = this.groupsPage()
        this.fetchGroupsPage( page?.pageNumber, page?.pageSize, true )
    }

    public addMembersToGroup (id: string, memberIds: string[]): Observable<AddedGroupMembersDto> {
        return this.api.addMembersToGroupById( this.selectedProjectId(), id, memberIds ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (response: AddedGroupMembersDto): void => {
                const added: number = response.members.length
                const partial: boolean = memberIds.length != added
                const prefixKey: string = partial ? 'groups.notifications.partial-add-member' : 'groups.notifications.add-member'
                this.notifyMessage(
                    partial ? SeverityEnum.WARNING : SeverityEnum.SUCCESS,
                    this.pluralTranslationPipe.transform( prefixKey + '.title', added ),
                    this.pluralTranslationPipe.transform( prefixKey + '.message', added ),
                    'pi pi-user-plus',
                    partial ? { asked: memberIds.length, added: added } : { added: added },
                )
                this.onMembersChanged( id )
            } ),
        )
    }

    public removeMemberFromGroup (id: string, participant: ParticipantModel): Observable<GroupModel> {
        return this.api.removeMemberFromGroupById( this.selectedProjectId(), id, participant.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (group: GroupModel): void => {
                this.notifySuccess( 'groups.notifications.remove-member', 'pi pi-user-minus', {
                    name: group?.name,
                    firstName: participant.firstName,
                    lastName: participant.lastName,
                } )
                this.onMembersChanged( id )
            } ),
        )
    }

    public handleGroupMembersChange (): Observable<unknown> {
        return this.commandEvents.on( 'group', 'members' )
    }

    private onMembersChanged (id: string): void {
        const page: PageModel<ParticipantModel> | undefined = this.groupMembersPage()
        this.fetchGroupMembersPage( id, page?.pageNumber, page?.pageSize, true )
        this.commandEvents.emit( 'group', 'members' )
    }
}
