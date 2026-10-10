import { OptionalProjectModel } from '@shared/models/model/generic-project.model'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface ActivityModel extends OptionalProjectModel {
    name: string
    status: SelectOptionModel<AvailabilityStatusEnum> | undefined
    description: string | undefined
    duration: SelectOptionModel<string> | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
