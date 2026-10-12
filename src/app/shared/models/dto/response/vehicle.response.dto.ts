import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface VehicleResponseDto extends GenericResponseDto {
    licensePlate: string
    brand: string
    model: string
    status: SelectOptionModel<PresenceStatusEnum>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
