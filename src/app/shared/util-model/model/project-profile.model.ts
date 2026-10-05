import { SelectItem } from 'primeng/api'
import { AvailabilityStatusEnum } from '../enumeration/availability-status.enum'
import { ProfileStatusEnum } from '../enumeration/profile-status.enum'
import { CustomDatetimeModel } from './custom-datetime.model'
import { GenericProjectModel } from './generic-project.model'
import { UserModel } from './user.model'

export interface ProjectProfileModel extends GenericProjectModel {
	user: UserModel
	role: SelectItem<string>
	availabilityStatus: SelectItem<AvailabilityStatusEnum>
	status: SelectItem<ProfileStatusEnum>
	startAccess: CustomDatetimeModel | undefined
	endAccess: CustomDatetimeModel | undefined
}
