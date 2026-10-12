import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ParticipantModel } from '@shared/models/model/participant.model'

/**
 * Purpose: Tells which commands a participant of a list offers to the signed-in user and runs them.
 * Scope: Builds the action menu (movements history, edit, hide, show, remove from a group, delete) with its confirmations; the group to remove a member from is the optional context.
 * Limits: Holds no state; it only reads the session and calls the participant and group facades. The backend still checks every command.
 */
@Injectable()
export class ParticipantActions extends ElementActionsBase<ParticipantModel, string> {
    protected readonly translationPrefix: string = 'participants'
    protected override readonly primaryActionId: string = 'movements-history'

    private readonly facade: ParticipantFacade = inject(ParticipantFacade)
    private readonly groupFacade: GroupFacade | null = inject(GroupFacade, { optional: true })
    private readonly router: Router = inject(Router)

    protected specsFor(participant: ParticipantModel, groupId?: string): ElementActionSpec[] {
        return [
            this.historySpec(participant),
            this.editSpec(participant),
            this.hideSpec(participant),
            this.showSpec(participant),
            this.removeMemberSpec(participant, groupId),
            this.deleteSpec(participant),
        ]
    }

    private historySpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'movements-history',
            icon: 'clock-rotate-left',
            enabledAction: ElementActionEnum.PARTICIPANT_CONSULT_MOVEMENTS,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_HISTORY_R),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_MOVEMENTS, participant),
        }
    }

    private editSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            enabledAction: ElementActionEnum.PARTICIPANT_UPDATE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_EDITION, participant),
        }
    }

    private hideSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            enabledAction: ElementActionEnum.PARTICIPANT_DISABLE,
            shown: participant.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.disableParticipant(participant.id)) },
        }
    }

    private showSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            enabledAction: ElementActionEnum.PARTICIPANT_ENABLE,
            shown: !participant.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            confirmation: { severity: SeverityEnum.INFO, icon: 'pi pi-info-circle', accept: (): void => this.run(this.facade.enableParticipant(participant.id)) },
        }
    }

    private removeMemberSpec(participant: ParticipantModel, groupId?: string): ElementActionSpec {
        return {
            id: 'remove-member',
            icon: 'user-minus',
            enabledAction: ElementActionEnum.PARTICIPANT_REMOVE_FROM_GROUP,
            shown: GenericHelper.nonNull(groupId),
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
            confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.groupFacade!.removeMemberFromGroup(groupId!, participant)) },
        }
    }

    private deleteSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            enabledAction: ElementActionEnum.PARTICIPANT_DELETE,
            shown: participant.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D),
            confirmation: { severity: SeverityEnum.DANGER, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.deleteParticipant(participant)) },
        }
    }

    private navigate(route: RegistryRouteEnum, participant: ParticipantModel): void {
        this.router.navigateByUrl(
            route.replace(':participantId', participant.id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
        ).catch((err: Error) => console.error(err))
    }
}
