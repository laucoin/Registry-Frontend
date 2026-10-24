import { inject, Injectable } from '@angular/core'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { AlertModel } from '@shared/models/model/alert.model'

/**
 * Purpose: Indique quelles commandes une alerte offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (résoudre, annuler, rouvrir, masquer, réafficher, supprimer) avec ses confirmations.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle la facade des alertes. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class AlertActions extends ElementActionsBase<AlertModel> {
    protected readonly translationPrefix: string = 'alerts'

    private readonly facade: AlertFacade = inject(AlertFacade)

    protected specsFor(alert: AlertModel): ElementActionSpec[] {
        return [
            this.statusSpec(alert, 'resolve', 'check', AlertStatusEnum.RESOLVED),
            this.statusSpec(alert, 'cancel', 'xmark', AlertStatusEnum.CANCELED),
            this.statusSpec(alert, 'reopen', 'rotate-right', AlertStatusEnum.IN_PROGRESS),
            this.hideSpec(alert),
            this.showSpec(alert),
            this.deleteSpec(alert),
        ]
    }

    private statusSpec(alert: AlertModel, id: string, icon: string, status: AlertStatusEnum): ElementActionSpec {
        const inProgress: boolean = alert.status.value === AlertStatusEnum.IN_PROGRESS
        return {
            id: id,
            icon: icon,
            shown: alert.visible && inProgress === (status !== AlertStatusEnum.IN_PROGRESS),
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U),
            confirmation: {
                severity: SeverityEnum.INFO,
                translationKey: `status.${status}`,
                accept: (): void => this.run(this.facade.updateAlertStatus(alert.id, status)),
            },
        }
    }

    private hideSpec(alert: AlertModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            shown: alert.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U),
            confirmation: { severity: SeverityEnum.WARNING, accept: (): void => this.run(this.facade.disableAlert(alert.id)) },
        }
    }

    private showSpec(alert: AlertModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            shown: !alert.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_D),
            confirmation: { severity: SeverityEnum.INFO, accept: (): void => this.run(this.facade.enableAlert(alert.id)) },
        }
    }

    private deleteSpec(alert: AlertModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_D),
            confirmation: { severity: SeverityEnum.DANGER, accept: (): void => this.run(this.facade.deleteAlert(alert)) },
        }
    }
}
