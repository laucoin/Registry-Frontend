import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

export interface ProjectOptionModel {
    value: ProjectOptionEnum,
    label: string,
    ask: string,
    preRequired: SelectOptionModel<ProjectOptionEnum>[],
}
