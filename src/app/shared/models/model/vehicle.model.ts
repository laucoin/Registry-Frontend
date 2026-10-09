import { OptionalProjectModel } from '@shared/models/model/generic-project.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

export interface VehicleModel extends OptionalProjectModel {
    licensePlate: string
    brand: string
    model: string
    status: SelectOptionModel<PresenceStatusEnum>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
