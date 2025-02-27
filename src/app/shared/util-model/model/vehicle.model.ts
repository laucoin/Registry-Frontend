import { GenericEventModel } from './generic-event.model'
import { CustomDatetimeModel } from './custom-datetime.model'
import { SelectItem } from 'primeng/api'

export interface VehicleModel extends GenericEventModel {
    licensePlate: string
    brand: string
    model: string
    status: SelectItem<string>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
