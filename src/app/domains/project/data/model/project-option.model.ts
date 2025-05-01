import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '../../../../shared/util-model/enumeration/project-option.enum'

export interface ProjectOptionModel {
    value: ProjectOptionEnum,
    label: string,
    ask: string,
    preRequired: SelectItem<ProjectOptionEnum>[],
}
