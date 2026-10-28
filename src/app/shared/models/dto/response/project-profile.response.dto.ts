import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'

export interface ProjectProfileResponseDto extends GenericProjectResponseDto {
    user: UserResponseDto
    role: SelectOptionModel<string>
    availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>
    status: SelectOptionModel<ProfileStatusEnum>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
