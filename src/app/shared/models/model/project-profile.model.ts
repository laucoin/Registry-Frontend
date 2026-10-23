import { GenericProjectModel } from '@shared/models/model/generic-project.model'
import { UserModel } from '@shared/models/model/user.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface ProjectProfileModel extends GenericProjectModel {
    user: UserModel
    role: SelectItem<string>
    availabilityStatus: SelectItem<AvailabilityStatusEnum>
    status: SelectItem<ProfileStatusEnum>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
