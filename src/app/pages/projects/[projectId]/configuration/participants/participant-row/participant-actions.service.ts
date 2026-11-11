import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ParticipantModel } from '@shared/models/model/participant.model';

/**
 * Objectif: Indique quelles commandes un participant d'une liste offre à l'utilisateur connecté et les exécute.
 * Périmètre: Construit le menu d'actions (historique des mouvements, modifier, supprimer, restaurer, retirer d'un groupe, export des données, supprimer définitivement) avec ses confirmations ; le groupe dont retirer un membre est le contexte optionnel.
 * Limites: Ne détient aucun état ; lit seulement la session et appelle les facades des participants et des groupes. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class ParticipantActions extends ElementActionsBase<ParticipantModel, string> {
	protected readonly translationPrefix: string = 'participants';
	protected override readonly primaryActionId: string = 'movements-history';

	private readonly facade = inject(ParticipantFacade);
	private readonly groupFacade = inject(GroupFacade, { optional: true });
	private readonly router = inject(Router);

	protected specsFor(participant: ParticipantModel, groupId?: string): ElementActionSpec[] {
		return [
			this.historySpec(participant),
			this.editSpec(participant),
			this.softDeleteSpec(participant),
			this.restoreSpec(participant),
			this.removeMemberSpec(participant, groupId),
			this.exportSpec(participant),
			this.hardDeleteSpec(participant),
		];
	}

	private historySpec(participant: ParticipantModel): ElementActionSpec {
		return {
			id: 'movements-history',
			icon: 'clock-rotate-left',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_HISTORY_R),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_MOVEMENTS, participant),
		};
	}

	private editSpec(participant: ParticipantModel): ElementActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_EDITION, participant),
		};
	}

	private softDeleteSpec(participant: ParticipantModel): ElementActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			shown: participant.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_SOFT_DELETE),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.run(this.facade.softDeleteParticipant(participant.id)),
			},
		};
	}

	private restoreSpec(participant: ParticipantModel): ElementActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			shown: !participant.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE),
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.run(this.facade.restoreParticipant(participant.id)),
			},
		};
	}

	private removeMemberSpec(participant: ParticipantModel, groupId?: string): ElementActionSpec {
		return {
			id: 'remove-member',
			icon: 'user-minus',
			shown: GenericHelper.nonNull(groupId),
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.removeMember(participant, groupId),
			},
		};
	}

	private removeMember(participant: ParticipantModel, groupId?: string): void {
		if (!this.groupFacade || GenericHelper.isNull(groupId)) return;
		this.run(this.groupFacade.removeMemberFromGroup(groupId, participant));
	}

	private exportSpec(participant: ParticipantModel): ElementActionSpec {
		return {
			id: 'export',
			icon: 'file-export',
			shown: true,
			allowed:
				this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_EXPORT) ||
				this.isLinkedToCurrentUser(participant),
			run: () => this.run(this.facade.exportParticipant(participant)),
		};
	}

	private isLinkedToCurrentUser(participant: ParticipantModel): boolean {
		return participant.user !== undefined && participant.user.id === this.sessionFacade.currentUser()?.id;
	}

	private hardDeleteSpec(participant: ParticipantModel): ElementActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.run(this.facade.hardDeleteParticipant(participant)),
			},
		};
	}

	private navigate(route: RegistryRouteEnum, participant: ParticipantModel): void {
		const url = RouteHelper.withProjectId(
			route.replace(':participantId', participant.id),
			this.sessionFacade.currentProjectId(),
		);
		this.router.navigateByUrl(url).catch((): void => undefined);
	}
}
