import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { GroupModel } from '@shared/models/model/group.model'

/**
 * Purpose: Tells which commands a group of a list offers to the signed-in user and runs them.
 * Scope: Builds the action menu (members, edit, hide, show, delete) with its confirmations.
 * Limits: Holds no state; it only reads the session and calls the group facade. The backend still checks every command.
 */
@Injectable()
export class GroupActions extends ElementActionsBase<GroupModel> {
    protected readonly translationPrefix: string = 'groups'
    protected override readonly primaryActionId: string = 'members'

    private readonly facade: GroupFacade = inject(GroupFacade)
    private readonly router: Router = inject(Router)

    protected specsFor(group: GroupModel): ElementActionSpec[] {
        return [
            this.membersSpec(group),
            this.editSpec(group),
            this.hideSpec(group),
            this.showSpec(group),
            this.deleteSpec(group),
        ]
    }

    private membersSpec(group: GroupModel): ElementActionSpec {
        return {
            id: 'members',
            icon: 'users',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS_MEMBERS, group),
        }
    }

    private editSpec(group: GroupModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS_EDITION, group),
        }
    }

    private hideSpec(group: GroupModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            shown: group.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
            confirmation: { severity: SeverityEnum.WARNING, accept: (): void => this.run(this.facade.disableGroup(group.id)) },
        }
    }

    private showSpec(group: GroupModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            shown: !group.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_D),
            confirmation: { severity: SeverityEnum.INFO, accept: (): void => this.run(this.facade.enableGroup(group.id)) },
        }
    }

    private deleteSpec(group: GroupModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_D),
            confirmation: { severity: SeverityEnum.DANGER, accept: (): void => this.run(this.facade.deleteGroup(group)) },
        }
    }

    private navigate(route: RegistryRouteEnum, group: GroupModel): void {
        this.router.navigateByUrl(
            route.replace(':groupId', group.id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
        ).catch((err: Error) => console.error(err))
    }
}
