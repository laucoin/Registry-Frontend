import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { OptionalProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface ActivityResponseDto extends OptionalProjectResponseDto {
    name: string
    status: SelectOptionModel<AvailabilityStatusEnum> | undefined
    description: string | undefined
    duration: SelectOptionModel<string> | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
