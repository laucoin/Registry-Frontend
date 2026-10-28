import { GenericModel } from '@shared/models/model/generic.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

export interface VehicleModel extends GenericModel {
    licensePlate: string
    brand: string
    model: string
    status: SelectOptionModel<PresenceStatusEnum>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
