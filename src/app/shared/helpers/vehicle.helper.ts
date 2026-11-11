import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

/**
 * Objectif: Construit les select items des véhicules.
 * Périmètre: Mapping pur d'un véhicule vers un select item.
 * Limites: Aucun état et aucune traduction.
 */
export const VehicleHelper = {
	toSelectItem(vehicle: VehicleModel): SelectOptionModel<VehicleModel> {
		return {
			label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
			value: vehicle,
		};
	},
} as const;
