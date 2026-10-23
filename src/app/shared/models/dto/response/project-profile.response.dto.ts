import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { SelectItem } from 'primeng/api'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'

export interface ProjectProfileResponseDto extends GenericProjectResponseDto {
    user: UserResponseDto
    role: SelectItem<string>
    availabilityStatus: SelectItem<AvailabilityStatusEnum>
    status: SelectItem<ProfileStatusEnum>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
