import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { MovementModel } from '@shared/models/model/movement.model';

/**
 * Purpose: Indique quelles commandes un mouvement offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (modifier, supprimer, restaurer, supprimer définitivement) avec ses confirmations.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle la facade des mouvements. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class MovementActions extends ElementActionsBase<MovementModel> {
	protected readonly translationPrefix: string = 'movements';

	private readonly facade = inject(MovementFacade);
	private readonly router = inject(Router);

	protected specsFor(movement: MovementModel): ElementActionSpec[] {
		return [
			this.editSpec(movement),
			this.softDeleteSpec(movement),
			this.restoreSpec(movement),
			this.hardDeleteSpec(movement),
		];
	}

	private editSpec(movement: MovementModel): ElementActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
			run: () => this.navigateToEdition(movement),
		};
	}

	private softDeleteSpec(movement: MovementModel): ElementActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			shown: movement.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_SOFT_DELETE),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.run(this.facade.softDeleteMovement(movement.id)),
			},
		};
	}

	private restoreSpec(movement: MovementModel): ElementActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			shown: !movement.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_RESTORE),
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.run(this.facade.restoreMovement(movement.id)),
			},
		};
	}

	private hardDeleteSpec(movement: MovementModel): ElementActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.run(this.facade.hardDeleteMovement(movement)),
			},
		};
	}

	private navigateToEdition(movement: MovementModel): void {
		const edition: RegistryRouteEnum =
			movement.contentType === ParticipantTypeEnum.GUEST
				? RegistryRouteEnum.PROJECTS_MOVEMENTS_GUEST_EDITION
				: RegistryRouteEnum.PROJECTS_MOVEMENTS_REGISTERED_EDITION;
		this.router
			.navigateByUrl(
				edition
					.replace(':movementId', movement.id)
					.replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
			)
			.catch((): void => undefined);
	}
}
