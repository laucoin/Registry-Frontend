import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { SelectItem } from 'primeng/api'

export interface ProjectResponseDto extends GenericResponseDto {
    name: string
    status: SelectItem<AvailabilityStatusEnum> | undefined
    begin: CustomDatetimeModel | undefined
    end: CustomDatetimeModel | undefined
    options: SelectItem<ProjectOptionEnum>[] | undefined
}
