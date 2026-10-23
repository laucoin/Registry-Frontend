import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { OptionalProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { SelectItem } from 'primeng/api'

export interface VehicleResponseDto extends OptionalProjectResponseDto {
    licensePlate: string
    brand: string
    model: string
    status: SelectItem<PresenceStatusEnum>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
