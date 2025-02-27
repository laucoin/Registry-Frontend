import { GenericEventModel } from './generic-event.model'
import { NumericRangeModel } from '../../../domains/activity/data/model/numeric-range.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from './custom-datetime.model'

export interface ActivityModel extends GenericEventModel {
    name: string
    description: string | undefined
    duration: SelectItem<string> | undefined
    allowedParticipants: NumericRangeModel | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
