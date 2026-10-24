import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

/**
 * Purpose: Construit les select items des véhicules.
 * Scope: Mapping pur d'un véhicule vers un select item.
 * Limits: Aucun état et aucune traduction.
 */
export class VehicleHelper {
    public static toSelectItem (vehicle: VehicleModel): SelectOptionModel<VehicleModel> {
        return {
            label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
            value: vehicle,
        }
    }
}
