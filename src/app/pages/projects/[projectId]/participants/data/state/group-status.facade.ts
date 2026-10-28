import { inject, Injectable, Signal } from '@angular/core'
import { GroupMembersBlock } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model'
import { GroupStatusStore } from '@pages/projects/[projectId]/participants/data/state/group-status.store'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { GroupModel } from '@shared/models/model/group.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageModel } from '@shared/models/model/page.model'

/**
 * Purpose: Point d'entrée public du domaine du statut des groupes pour les pages et composants.
 * Scope: Expose les pages de mes groupes et de tous les groupes, ainsi que les membres sur site des groupes ouverts, sous forme de signals et relaie leurs requêtes.
 * Limits: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class GroupStatusFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof GroupStatusStore> = inject( GroupStatusStore )

    public readonly myGroupsPage: Signal<PageModel<GroupModel> | undefined> = this.store.mine.element

    public readonly myGroupsPageLoading: Signal<boolean> = this.store.mine.loading

    public readonly myGroupsPageSilentLoading: Signal<boolean> = this.store.mine.silentLoading

    public readonly myGroupsPageError: Signal<NotificationModel | undefined> = this.store.mine.error

    public readonly groupsPage: Signal<PageModel<GroupModel> | undefined> = this.store.groups.element

    public readonly groupsPageLoading: Signal<boolean> = this.store.groups.loading

    public readonly groupsPageSilentLoading: Signal<boolean> = this.store.groups.silentLoading

    public readonly groupsPageError: Signal<NotificationModel | undefined> = this.store.groups.error

    public readonly membersByGroup: Signal<Record<string, GroupMembersBlock>> = this.store.members

    public fetchMyGroupsPage (page: number | undefined, size: number | undefined): void {
        this.store.fetchMyGroupsPage( { projectId: this.selectedProjectId(), page: page, size: size } )
    }

    public fetchGroupsPage (page: number | undefined, size: number | undefined): void {
        this.store.fetchGroupsPage( { projectId: this.selectedProjectId(), page: page, size: size } )
    }

    public fetchGroupMembersPage (groupId: string, page: number | undefined, size: number | undefined): void {
        this.store.fetchGroupMembersPage( { projectId: this.selectedProjectId(), groupId: groupId, page: page, size: size } )
    }
}
