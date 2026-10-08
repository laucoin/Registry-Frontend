import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { SelectItem } from 'primeng/api'

export interface ProjectOptionResponseDto {
    value: ProjectOptionEnum
    label: string
    ask: string
    preRequired: SelectItem<ProjectOptionEnum>[]
}
