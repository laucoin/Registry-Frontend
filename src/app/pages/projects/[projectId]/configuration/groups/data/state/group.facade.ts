import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GroupModel } from '@shared/models/model/group.model'
import { GroupStore } from '@pages/projects/[projectId]/configuration/groups/data/state/group.store'
import { DateHelper } from '@shared/helpers/date.helper'
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { AddedGroupMembersDto } from '@shared/models/dto/added-group-members.dto'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'

/**
 * Purpose: Public entry point of the group domain for pages, components and guards.
 * Scope: Exposes the group store as signals, forwards its queries and runs the group commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class GroupFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof GroupStore> = inject( GroupStore )

    private readonly api: GroupApi = inject( GroupApi )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )

    public readonly groupsPage: Signal<PageModel<GroupModel> | undefined> = this.store.groups.element

    public readonly groupsPageLoading: Signal<boolean> = this.store.groups.loading

    public readonly groupsPageSilentLoading: Signal<boolean> = this.store.groups.silentLoading

    public readonly groupsPageError: Signal<NotificationModel | undefined> = this.store.groups.error

    public readonly groupsPageResetSearch: Signal<boolean> = this.store.groups.params.resetSearch

    public readonly groupsPageQueryParam: Signal<string | undefined> = this.store.groups.params.q

    public readonly groupsPageAtParam: Signal<Date | undefined> = computed( () =>
            DateHelper.buildDate( this.store.groups.params.at() ),
        )

    public readonly groupsPageIsPresentParam: Signal<boolean | undefined> = this.store.groups.params.isPresent

    public readonly groupsPageIsVisibleParam: Signal<boolean | undefined> = this.store.groups.params.isVisible

    public readonly groupMembersPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.members.element

    public readonly groupMembersPageLoading: Signal<boolean> = this.store.members.loading

    public readonly groupMembersPageSilentLoading: Signal<boolean> = this.store.members.silentLoading

    public readonly groupMembersPageError: Signal<NotificationModel | undefined> = this.store.members.error

    public readonly groupMembersPageResetSearch: Signal<boolean> = this.store.members.params.resetSearch

    public readonly groupMembersPageQueryParam: Signal<string | undefined> = this.store.members.params.q

    public readonly groupMembersPageStatusParam: Signal<string | undefined> = this.store.members.params.status

    public readonly groupMembersPageIsVisibleParam: Signal<boolean | undefined> = this.store.members.params.isVisible

    public readonly searchedParticipantsMetadata: Signal<SelectOptionModel<ParticipantModel>[]> = this.store.metadata.searched

    public readonly availabilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( (): SelectOptionModel<boolean | undefined>[] =>
            this.store.metadata.availabilities().map( (status: SelectOptionModel<boolean | undefined>): SelectOptionModel<boolean | undefined> => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( (): SelectOptionModel<boolean | undefined>[] =>
            this.store.metadata.visibilities().map( (status: SelectOptionModel<boolean | undefined>): SelectOptionModel<boolean | undefined> => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public fetchGroupsPage (
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.groupsPageResetSearch() ? 0 : page
        this.store.fetchGroupsPage( { projectId: this.selectedProjectId(), page: index, size: size } )
    }

    public inputPageSearchParameters (
        q: string | undefined,
        at: Date | undefined,
        isPresent: boolean | undefined,
        isVisible: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.groupsPageQueryParam() != q
                                     || this.groupsPageIsPresentParam() != isPresent
                                     || this.groupsPageAtParam()?.toISOString() != at?.toISOString()
                                     || this.groupsPageIsVisibleParam() != isVisible

        if (resetSearch) {
            this.store.updateGroupsPageSearchParams( {
                resetSearch: resetSearch,
                q: q,
                isPresent: isPresent,
                isVisible: isVisible,
                at: at?.toISOString(),
            } )
        }
    }

    public fetchGroupMembersPage (
        id: string,
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.groupMembersPageResetSearch() ? 0 : page
        this.store.fetchGroupMembersPage( { projectId: this.selectedProjectId(), id: id, page: index, size: size } )
    }

    public inputMembersPageSearchParameters (
        q: string | undefined,
        status: string | undefined,
        isVisible: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.groupMembersPageQueryParam() != q
                                     || this.groupMembersPageStatusParam() != status
                                     || this.groupMembersPageIsVisibleParam() != isVisible

        if (resetSearch) {
            this.store.updateGroupMembersPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                status: status,
                q: q,
            } )
        }
    }

    public searchParticipants (
        q: string | undefined = undefined,
    ): void {
        this.store.searchParticipants( { projectId: this.selectedProjectId(), q: q } )
    }

    public fetchGroup (id: string): Observable<GroupModel> {
        return this.api.findGroupById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
        )
    }

    public createGroup (group: GroupDto): Observable<GroupModel> {
        return this.api.createGroup( this.selectedProjectId(), group ).pipe(
            tap( (created: GroupModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateGroup (id: string, group: GroupDto, ifMatch?: string): Observable<GroupModel> {
        return this.api.updateGroupById( this.selectedProjectId(), id, group, ifMatch ).pipe(
            tap( (updated: GroupModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableGroup (id: string): Observable<GroupModel> {
        return this.api.disableGroupById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: GroupModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableGroup (id: string): Observable<GroupModel> {
        return this.api.enableGroupById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: GroupModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteGroup (group: GroupModel): Observable<void> {
        return this.api.deleteGroupById( undefined, group.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', group ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, group: GroupModel): void {
        this.onCommandSucceeded( 'group', command, 'groups.notifications', { name: group?.name } )

        this.store.fetchGroupsPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.groupsPage() ) } )
    }

    public addMembersToGroup (id: string, memberIds: string[]): Observable<AddedGroupMembersDto> {
        return this.api.addMembersToGroupById( this.selectedProjectId(), id, memberIds ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (response: AddedGroupMembersDto): void => {
                const added: number = response.members.length
                const partial: boolean = memberIds.length != added
                const prefixKey: string = partial ? 'groups.notifications.partial-add-member' : 'groups.notifications.add-member'
                this.notifyMessage(
                    partial ? SeverityEnum.WARNING : SeverityEnum.SUCCESS,
                    this.pluralTranslationPipe.transform( prefixKey + '.title', added ),
                    this.pluralTranslationPipe.transform( prefixKey + '.message', added ),
                    partial ? { asked: memberIds.length, added: added } : { added: added },
                )
                this.onMembersChanged( id )
            } ),
        )
    }

    public removeMemberFromGroup (id: string, participant: ParticipantModel): Observable<void> {
        return this.api.removeMemberFromGroupById( this.selectedProjectId(), id, participant.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => {
                this.notifySuccess( 'groups.notifications.remove-member', {
                    name: participant.groups?.find( (group: GroupModel): boolean => group.id === id )?.name,
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

    public reloadGroupMembersPage (id: string): void {
        this.store.fetchGroupMembersPage( { projectId: this.selectedProjectId(), id: id, ...CumulativePageHelper.reloadRequest( this.groupMembersPage() ) } )
    }

    private onMembersChanged (id: string): void {
        this.reloadGroupMembersPage( id )
        this.commandEvents.emit( 'group', 'members' )
    }
}
