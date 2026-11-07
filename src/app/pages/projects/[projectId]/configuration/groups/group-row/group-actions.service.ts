import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { GroupModel } from '@shared/models/model/group.model';

/**
 * Purpose: Indique quelles commandes un groupe d'une liste offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (membres, modifier, supprimer, restaurer, supprimer définitivement) avec ses confirmations.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle la facade des groupes. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class GroupActions extends ElementActionsBase<GroupModel> {
	protected readonly translationPrefix: string = 'groups';
	protected override readonly primaryActionId: string = 'members';

	private readonly facade = inject(GroupFacade);
	private readonly router = inject(Router);

	protected specsFor(group: GroupModel): ElementActionSpec[] {
		return [
			this.membersSpec(group),
			this.editSpec(group),
			this.softDeleteSpec(group),
			this.restoreSpec(group),
			this.hardDeleteSpec(group),
		];
	}

	private membersSpec(group: GroupModel): ElementActionSpec {
		return {
			id: 'members',
			icon: 'users',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS_MEMBERS, group),
		};
	}

	private editSpec(group: GroupModel): ElementActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS_EDITION, group),
		};
	}

	private softDeleteSpec(group: GroupModel): ElementActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			shown: group.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_SOFT_DELETE),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.run(this.facade.softDeleteGroup(group.id)),
			},
		};
	}

	private restoreSpec(group: GroupModel): ElementActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			shown: !group.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_RESTORE),
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.run(this.facade.restoreGroup(group.id)),
			},
		};
	}

	private hardDeleteSpec(group: GroupModel): ElementActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.run(this.facade.hardDeleteGroup(group)),
			},
		};
	}

	private navigate(route: RegistryRouteEnum, group: GroupModel): void {
		this.router
			.navigateByUrl(
				route.replace(':groupId', group.id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
			)
			.catch((): void => undefined);
	}
}
