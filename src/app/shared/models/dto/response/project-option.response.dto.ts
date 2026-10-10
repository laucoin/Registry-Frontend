import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface ProjectOptionResponseDto {
    value: ProjectOptionEnum
    label: string
    ask: string
    preRequired: SelectOptionModel<ProjectOptionEnum>[]
}
