import { SelectItem } from 'primeng/api'
import { VehicleModel } from '../../util-model/model/vehicle.model'

export class VehicleUtil {
    public static toSelectItem (vehicle: VehicleModel): SelectItem<VehicleModel> {
        return {
            label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
            value: vehicle,
        }
    }
}
