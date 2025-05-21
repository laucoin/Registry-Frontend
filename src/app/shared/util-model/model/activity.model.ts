import { GenericProjectModel } from './generic-project.model'
import { NumericRangeModel } from '../../../domains/project/configuration/activity/data/model/numeric-range.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from './custom-datetime.model'
import { AvailabilityStatusEnum } from '../enumeration/availability-status.enum'

export interface ActivityModel extends GenericProjectModel {
    name: string
    status: SelectItem<AvailabilityStatusEnum> | undefined
    description: string | undefined
    duration: SelectItem<string> | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
