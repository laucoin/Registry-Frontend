import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { VehicleModel } from '@shared/models/model/vehicle.model'

/**
 * Purpose: Tells which commands a vehicle of a list offers to the signed-in user and runs them.
 * Scope: Builds the action menu (movements history, edit, hide, show, delete) with its confirmations.
 * Limits: Holds no state; it only reads the session and calls the vehicle facade. The backend still checks every command.
 */
@Injectable()
export class VehicleActions extends ElementActionsBase<VehicleModel> {
    protected readonly translationPrefix: string = 'vehicles'
    protected override readonly primaryActionId: string = 'movements-history'

    private readonly facade: VehicleFacade = inject(VehicleFacade)
    private readonly router: Router = inject(Router)

    protected specsFor(vehicle: VehicleModel): ElementActionSpec[] {
        return [
            this.historySpec(vehicle),
            this.editSpec(vehicle),
            this.hideSpec(vehicle),
            this.showSpec(vehicle),
            this.deleteSpec(vehicle),
        ]
    }

    private historySpec(vehicle: VehicleModel): ElementActionSpec {
        return {
            id: 'movements-history',
            icon: 'clock-rotate-left',
            enabledAction: ElementActionEnum.VEHICLE_CONSULT_MOVEMENTS,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_HISTORY_R),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_MOVEMENTS, vehicle),
        }
    }

    private editSpec(vehicle: VehicleModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            enabledAction: ElementActionEnum.VEHICLE_UPDATE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_EDITION, vehicle),
        }
    }

    private hideSpec(vehicle: VehicleModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            enabledAction: ElementActionEnum.VEHICLE_DISABLE,
            shown: vehicle.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U),
            confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.disableVehicle(vehicle.id)) },
        }
    }

    private showSpec(vehicle: VehicleModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            enabledAction: ElementActionEnum.VEHICLE_ENABLE,
            shown: !vehicle.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U),
            confirmation: { severity: SeverityEnum.INFO, icon: 'pi pi-info-circle', accept: (): void => this.run(this.facade.enableVehicle(vehicle.id)) },
        }
    }

    private deleteSpec(vehicle: VehicleModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            enabledAction: ElementActionEnum.VEHICLE_DELETE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_D),
            confirmation: { severity: SeverityEnum.DANGER, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.deleteVehicle(vehicle)) },
        }
    }

    private navigate(route: RegistryRouteEnum, vehicle: VehicleModel): void {
        this.router.navigateByUrl(
            route.replace(':vehicleId', vehicle.id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
        ).catch((err: Error) => console.error(err))
    }
}
