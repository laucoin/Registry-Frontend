import { inject, Injectable } from '@angular/core'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CommunicationModel } from '@shared/models/model/communication.model'

/**
 * Purpose: Indique quelles commandes une communication offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (modifier, masquer, réafficher, supprimer) avec ses confirmations.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle la facade des communications. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class CommunicationActions extends ElementActionsBase<CommunicationModel> {
    protected readonly translationPrefix: string = 'communications'

    private readonly facade: CommunicationFacade = inject(CommunicationFacade)

    protected specsFor(communication: CommunicationModel): ElementActionSpec[] {
        return [this.editSpec(communication), this.softDeleteSpec(communication), this.restoreSpec(communication), this.hardDeleteSpec(communication)]
    }

    private editSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U),
            run: (): void => this.facade.fetchCommunication(communication.id),
        }
    }

    private softDeleteSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'softDelete',
            icon: 'eye-slash',
            shown: communication.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_SOFT_DELETE),
            confirmation: { severity: SeverityEnum.WARNING, accept: (): void => this.run(this.facade.softDeleteCommunication(communication.id)) },
        }
    }

    private restoreSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'restore',
            icon: 'rotate-right',
            shown: !communication.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_RESTORE),
            confirmation: { severity: SeverityEnum.INFO, accept: (): void => this.run(this.facade.restoreCommunication(communication.id)) },
        }
    }

    private hardDeleteSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'hardDelete',
            icon: 'trash',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_D),
            confirmation: { severity: SeverityEnum.DANGER, accept: (): void => this.run(this.facade.hardDeleteCommunication(communication)) },
        }
    }
}
