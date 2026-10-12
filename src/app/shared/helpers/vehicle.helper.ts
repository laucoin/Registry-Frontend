import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

/**
 * Purpose: Builds select items for vehicles.
 * Scope: Pure mapping from a vehicle to a select item.
 * Limits: No state and no translation.
 */
export class VehicleHelper {
    public static toSelectItem (vehicle: VehicleModel): SelectOptionModel<VehicleModel> {
        return {
            label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
            value: vehicle,
        }
    }
}
