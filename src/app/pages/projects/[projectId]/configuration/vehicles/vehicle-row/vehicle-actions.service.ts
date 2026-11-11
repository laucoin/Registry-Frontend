import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { VehicleModel } from '@shared/models/model/vehicle.model';

/**
 * Objectif: Indique quelles commandes un véhicule d'une liste offre à l'utilisateur connecté et les exécute.
 * Périmètre: Construit le menu d'actions (historique des mouvements, modifier, supprimer, restaurer, supprimer définitivement) avec ses confirmations.
 * Limites: Ne détient aucun état ; lit seulement la session et appelle la facade des véhicules. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class VehicleActions extends ElementActionsBase<VehicleModel> {
	protected readonly translationPrefix: string = 'vehicles';
	protected override readonly primaryActionId: string = 'movements-history';

	private readonly facade = inject(VehicleFacade);
	private readonly router = inject(Router);

	protected specsFor(vehicle: VehicleModel): ElementActionSpec[] {
		return [
			this.historySpec(vehicle),
			this.editSpec(vehicle),
			this.softDeleteSpec(vehicle),
			this.restoreSpec(vehicle),
			this.hardDeleteSpec(vehicle),
		];
	}

	private historySpec(vehicle: VehicleModel): ElementActionSpec {
		return {
			id: 'movements-history',
			icon: 'clock-rotate-left',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_HISTORY_R),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_MOVEMENTS, vehicle),
		};
	}

	private editSpec(vehicle: VehicleModel): ElementActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_EDITION, vehicle, true),
		};
	}

	private softDeleteSpec(vehicle: VehicleModel): ElementActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			shown: vehicle.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_SOFT_DELETE),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.run(this.facade.softDeleteVehicle(vehicle.id)),
			},
		};
	}

	private restoreSpec(vehicle: VehicleModel): ElementActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			shown: !vehicle.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_RESTORE),
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.run(this.facade.restoreVehicle(vehicle.id)),
			},
		};
	}

	private hardDeleteSpec(vehicle: VehicleModel): ElementActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.run(this.facade.hardDeleteVehicle(vehicle)),
			},
		};
	}

	private navigate(route: RegistryRouteEnum, vehicle: VehicleModel, keepQuery = false): void {
		const url = RouteHelper.withProjectId(
			route.replace(':vehicleId', vehicle.id),
			this.sessionFacade.currentProjectId(),
		);
		this.router
			.navigateByUrl(keepQuery ? RouteHelper.preservingQuery(url, this.router.url) : url)
			.catch((): void => undefined);
	}
}
