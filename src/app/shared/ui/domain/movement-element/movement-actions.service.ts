import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { MovementModel } from '@shared/models/model/movement.model'

/**
 * Purpose: Tells which commands a movement offers to the signed-in user and runs them.
 * Scope: Builds the action menu (edit, hide, show, delete) with its confirmations.
 * Limits: Holds no state; it only reads the session and calls the movement facade. The backend still checks every command.
 */
@Injectable()
export class MovementActions extends ElementActionsBase<MovementModel> {
    protected readonly translationPrefix: string = 'movements'

    private readonly facade: MovementFacade = inject(MovementFacade)
    private readonly router: Router = inject(Router)

    protected specsFor(movement: MovementModel): ElementActionSpec[] {
        return [this.editSpec(movement), this.hideSpec(movement), this.showSpec(movement), this.deleteSpec(movement)]
    }

    private editSpec(movement: MovementModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
            run: (): void => this.navigateToEdition(movement),
        }
    }

    private hideSpec(movement: MovementModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            shown: movement.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
            confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.disableMovement(movement.id)) },
        }
    }

    private showSpec(movement: MovementModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            shown: !movement.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_D),
            confirmation: { severity: SeverityEnum.INFO, icon: 'pi pi-info-circle', accept: (): void => this.run(this.facade.enableMovement(movement.id)) },
        }
    }

    private deleteSpec(movement: MovementModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_D),
            confirmation: { severity: SeverityEnum.DANGER, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.deleteMovement(movement)) },
        }
    }

    private navigateToEdition(movement: MovementModel): void {
        const edition: RegistryRouteEnum = movement.contentType === ParticipantTypeEnum.GUEST
                                           ? RegistryRouteEnum.PROJECTS_MOVEMENTS_GUEST_EDITION
                                           : RegistryRouteEnum.PROJECTS_MOVEMENTS_REGISTERED_EDITION
        this.router.navigateByUrl(
            edition.replace(':movementId', movement.id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
        ).catch((err: Error) => console.error(err))
    }
}
