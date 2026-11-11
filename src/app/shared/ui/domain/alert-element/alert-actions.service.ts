import { inject, Injectable } from '@angular/core';

import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { AlertModel } from '@shared/models/model/alert.model';

/**
 * Objectif: Indique quelles commandes une alerte offre à l'utilisateur connecté et les exécute.
 * Périmètre: Construit le menu d'actions (résoudre, annuler, rouvrir, supprimer, restaurer, supprimer définitivement) avec ses confirmations.
 * Limites: Ne détient aucun état ; lit seulement la session et appelle la facade des alertes. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class AlertActions extends ElementActionsBase<AlertModel> {
	protected readonly translationPrefix: string = 'alerts';

	private readonly facade = inject(AlertFacade);

	protected specsFor(alert: AlertModel): ElementActionSpec[] {
		return [
			this.statusSpec(alert, 'resolve', 'check', AlertStatusEnum.RESOLVED),
			this.statusSpec(alert, 'cancel', 'xmark', AlertStatusEnum.CANCELED),
			this.statusSpec(alert, 'reopen', 'rotate-right', AlertStatusEnum.IN_PROGRESS),
			this.softDeleteSpec(alert),
			this.restoreSpec(alert),
			this.hardDeleteSpec(alert),
		];
	}

	private statusSpec(alert: AlertModel, id: string, icon: string, status: AlertStatusEnum): ElementActionSpec {
		const inProgress = alert.status.value === AlertStatusEnum.IN_PROGRESS;
		return {
			id: id,
			icon: icon,
			shown: alert.visible && inProgress === (status !== AlertStatusEnum.IN_PROGRESS),
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U),
			confirmation: {
				severity: SeverityEnum.INFO,
				translationKey: `status.${status}`,
				accept: () => this.run(this.facade.updateAlertStatus(alert.id, status)),
			},
		};
	}

	private softDeleteSpec(alert: AlertModel): ElementActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			shown: alert.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_SOFT_DELETE),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.run(this.facade.softDeleteAlert(alert.id)),
			},
		};
	}

	private restoreSpec(alert: AlertModel): ElementActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			shown: !alert.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_RESTORE),
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.run(this.facade.restoreAlert(alert.id)),
			},
		};
	}

	private hardDeleteSpec(alert: AlertModel): ElementActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.run(this.facade.hardDeleteAlert(alert)),
			},
		};
	}
}
