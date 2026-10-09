import { GenericProjectModel } from '@shared/models/model/generic-project.model'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface ActivityModel extends GenericProjectModel {
    name: string
    status: SelectItem<AvailabilityStatusEnum> | undefined
    description: string | undefined
    duration: SelectItem<string> | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
