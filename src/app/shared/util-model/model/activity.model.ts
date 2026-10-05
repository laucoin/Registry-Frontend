import { SelectItem } from 'primeng/api'
import { NumericRangeModel } from '../../../domains/project/configuration/activity/data/model/numeric-range.model'
import { AvailabilityStatusEnum } from '../enumeration/availability-status.enum'
import { CustomDatetimeModel } from './custom-datetime.model'
import { GenericProjectModel } from './generic-project.model'

export interface ActivityModel extends GenericProjectModel {
	name: string
	status: SelectItem<AvailabilityStatusEnum> | undefined
	description: string | undefined
	duration: SelectItem<string> | undefined
	allowedParticipants: NumericRangeModel | undefined
	startAvailability: CustomDatetimeModel | undefined
	endAvailability: CustomDatetimeModel | undefined
}
