import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface ActivityDto {
    name: string
    description: string | undefined
    duration: string | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
