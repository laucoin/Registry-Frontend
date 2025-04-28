import { NumericRangeModel } from '../model/numeric-range.model'
import { CustomDatetimeModel } from '../../../../../../shared/util-model/model/custom-datetime.model'

export interface ActivityDto {
    name: string
    description: string | undefined
    duration: string | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
