import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ParticipantModel } from '@shared/models/model/participant.model'

/**
 * Purpose: Indique quelles commandes un participant d'une liste offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (historique des mouvements, modifier, masquer, réafficher, retirer d'un groupe, export des données, supprimer) avec ses confirmations ; le groupe dont retirer un membre est le contexte optionnel.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle les facades des participants et des groupes. Le backend vérifie toujours chaque commande.
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
            this.exportSpec(participant),
            this.deleteSpec(participant),
        ]
    }

    private historySpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'movements-history',
            icon: 'clock-rotate-left',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_HISTORY_R),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_MOVEMENTS, participant),
        }
    }

    private editSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_EDITION, participant),
        }
    }

    private hideSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            shown: participant.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            confirmation: { severity: SeverityEnum.WARNING, accept: (): void => this.run(this.facade.disableParticipant(participant.id)) },
        }
    }

    private showSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            shown: !participant.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D),
            confirmation: { severity: SeverityEnum.INFO, accept: (): void => this.run(this.facade.enableParticipant(participant.id)) },
        }
    }

    private removeMemberSpec(participant: ParticipantModel, groupId?: string): ElementActionSpec {
        return {
            id: 'remove-member',
            icon: 'user-minus',
            shown: GenericHelper.nonNull(groupId),
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
            confirmation: { severity: SeverityEnum.WARNING, accept: (): void => this.run(this.groupFacade!.removeMemberFromGroup(groupId!, participant)) },
        }
    }

    private exportSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'export',
            icon: 'file-export',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_EXPORT) || this.isLinkedToCurrentUser(participant),
            run: (): void => this.run(this.facade.exportParticipant(participant)),
        }
    }

    private isLinkedToCurrentUser(participant: ParticipantModel): boolean {
        return participant.user !== undefined && participant.user.id === this.sessionFacade.currentUser()?.id
    }

    private deleteSpec(participant: ParticipantModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            shown: participant.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D),
            confirmation: { severity: SeverityEnum.DANGER, accept: (): void => this.run(this.facade.deleteParticipant(participant)) },
        }
    }

    private navigate(route: RegistryRouteEnum, participant: ParticipantModel): void {
        this.router.navigateByUrl(
            route.replace(':participantId', participant.id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
        ).catch((err: Error) => console.error(err))
    }
}
