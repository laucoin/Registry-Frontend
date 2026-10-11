import { inject, Injectable } from '@angular/core'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CommunicationModel } from '@shared/models/model/communication.model'

/**
 * Purpose: Tells which commands a communication offers to the signed-in user and runs them.
 * Scope: Builds the action menu (edit, hide, show, delete) with its confirmations.
 * Limits: Holds no state; it only reads the session and calls the communication facade. The backend still checks every command.
 */
@Injectable()
export class CommunicationActions extends ElementActionsBase<CommunicationModel> {
    protected readonly translationPrefix: string = 'communications'

    private readonly facade: CommunicationFacade = inject(CommunicationFacade)

    protected specsFor(communication: CommunicationModel): ElementActionSpec[] {
        return [this.editSpec(communication), this.hideSpec(communication), this.showSpec(communication), this.deleteSpec(communication)]
    }

    private editSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            enabledAction: ElementActionEnum.COMMUNICATION_UPDATE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U),
            run: (): void => this.facade.fetchCommunication(communication.id),
        }
    }

    private hideSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            enabledAction: ElementActionEnum.COMMUNICATION_DISABLE,
            shown: communication.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U),
            confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.disableCommunication(communication.id)) },
        }
    }

    private showSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            enabledAction: ElementActionEnum.COMMUNICATION_ENABLE,
            shown: !communication.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U),
            confirmation: { severity: SeverityEnum.INFO, icon: 'pi pi-info-circle', accept: (): void => this.run(this.facade.enableCommunication(communication.id)) },
        }
    }

    private deleteSpec(communication: CommunicationModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            enabledAction: ElementActionEnum.COMMUNICATION_DELETE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_D),
            confirmation: { severity: SeverityEnum.DANGER, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.deleteCommunication(communication)) },
        }
    }
}
