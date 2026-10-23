import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
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
    private readonly store: InstanceType<typeof GroupStore> = inject( GroupStore )

    private readonly api: GroupApi = inject( GroupApi )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    public readonly groupsPage: Signal<PageModel<GroupModel> | undefined> = this.store.groups.element

    public readonly groupsPageLoading: Signal<boolean> = this.store.groups.loading

    public readonly groupsPageSilentLoading: Signal<boolean> = this.store.groups.silentLoading

    public readonly groupsPageError: Signal<ToastMessageOptions | undefined> = this.store.groups.error

    public readonly groupsPageResetSearch: Signal<boolean> = this.store.groups.params.resetSearch

    public readonly groupsPageTextSearchedParam: Signal<string | undefined> = this.store.groups.params.textSearched

    public readonly groupsPageDateTimeSearchedParam: Signal<Date | undefined> = computed( () =>
            DateHelper.buildDate( this.store.groups.params.dateTimeSearched() ),
        )

    public readonly groupsPagePresenceSearchedParam: Signal<boolean | undefined> = this.store.groups.params.presenceSearched

    public readonly groupsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.groups.params.visibilitySearched

    public readonly groupMembersPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.members.element

    public readonly groupMembersPageLoading: Signal<boolean> = this.store.members.loading

    public readonly groupMembersPageSilentLoading: Signal<boolean> = this.store.members.silentLoading

    public readonly groupMembersPageError: Signal<ToastMessageOptions | undefined> = this.store.members.error

    public readonly groupMembersPageResetSearch: Signal<boolean> = this.store.members.params.resetSearch

    public readonly groupMembersPageTextSearchedParam: Signal<string | undefined> = this.store.members.params.textSearched

    public readonly groupMembersPageStatusSearchedParam: Signal<string | undefined> = this.store.members.params.statusSearched

    public readonly groupMembersPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.members.params.visibilitySearched

    public readonly searchedParticipantsMetadata: Signal<SelectItem<ParticipantModel>[]> = this.store.metadata.searched

    public readonly availabilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( (): SelectItem<boolean | undefined>[] =>
            this.store.metadata.availabilities().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )

    public readonly visibilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( (): SelectItem<boolean | undefined>[] =>
            this.store.metadata.visibilities().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )

    public fetchGroupsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.groupsPageResetSearch() ? 0 : pageNumber
        this.store.fetchGroupsPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
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
            this.store.updateGroupsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                presenceSearched: presenceSearched,
                visibilitySearched: visibilitySearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } )
        }
    }

    public fetchGroupMembersPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.groupMembersPageResetSearch() ? 0 : pageNumber
        this.store.fetchGroupMembersPage( { projectId: this.selectedProjectId(), id: id, pageNumber: index, pageSize: pageSize } )
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
            this.store.updateGroupMembersPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                statusSearched: statusSearched,
                textSearched: textSearched,
            } )
        }
    }

    public searchParticipants (
        textSearched: string | undefined = undefined,
    ): void {
        this.store.searchParticipants( { projectId: this.selectedProjectId(), textSearched: textSearched } )
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
        this.fetchGroupsPage( page?.pageNumber, page?.pageSize )
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
        this.fetchGroupMembersPage( id, page?.pageNumber, page?.pageSize )
        this.commandEvents.emit( 'group', 'members' )
    }
}
