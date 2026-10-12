import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface InvitationProjectResponseDto {
    id: string
    name: string
    begin: CustomDatetimeModel | undefined
    end: CustomDatetimeModel | undefined
}

export interface UserInvitationResponseDto extends GenericProjectResponseDto {
    project: InvitationProjectResponseDto | undefined
    role: SelectOptionModel<string>
    availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>
    status: SelectOptionModel<ProfileStatusEnum>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
