import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { CurrentProjectProfileResponseDto } from '@shared/models/dto/response/current-project-profile.response.dto'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

interface ProjectCountsResponseDto {
    participants: number
    groups: number
    acceptedProfiles: number
    vehicles: number | undefined
    activities: number | undefined
    activeAlerts: number | undefined
}

export interface ProjectResponseDto extends GenericResponseDto {
    name: string
    status: SelectOptionModel<AvailabilityStatusEnum> | undefined
    begin: CustomDatetimeModel | undefined
    end: CustomDatetimeModel | undefined
    options: SelectOptionModel<ProjectOptionEnum>[] | undefined
    counts: ProjectCountsResponseDto | undefined
    favorite: boolean | undefined
    profile: CurrentProjectProfileResponseDto | undefined
}
