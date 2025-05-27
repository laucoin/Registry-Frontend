import { GenericProjectModel } from './generic-project.model'
import { UserModel } from './user.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from './custom-datetime.model'
import { ProfileStatusEnum } from '../enumeration/profile-status.enum'
import { AvailabilityStatusEnum } from '../enumeration/availability-status.enum'

export interface ProjectProfileModel extends GenericProjectModel {
    user: UserModel
    role: SelectItem<string>
    availabilityStatus: SelectItem<AvailabilityStatusEnum>
    status: SelectItem<ProfileStatusEnum>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
