import { SelectItem } from 'primeng/api'
import { VehicleModel } from '@shared/models/model/vehicle.model'

export class VehicleHelper {
    public static toSelectItem (vehicle: VehicleModel): SelectItem<VehicleModel> {
        return {
            label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
            value: vehicle,
        }
    }
}
