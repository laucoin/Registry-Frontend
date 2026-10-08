import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { NumericRangeModel } from '@pages/projects/[projectId]/configuration/activities/data/model/numeric-range.model'
import { SelectItem } from 'primeng/api'

export interface ActivityResponseDto extends GenericProjectResponseDto {
    name: string
    status: SelectItem<AvailabilityStatusEnum> | undefined
    description: string | undefined
    duration: SelectItem<string> | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
