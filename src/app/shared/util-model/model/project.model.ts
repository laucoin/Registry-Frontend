import { GenericModel } from './generic.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from './custom-datetime.model'
import { ProjectOptionEnum } from '../enumeration/project-option.enum'

export interface ProjectModel extends GenericModel {
    name: string,
    begin: CustomDatetimeModel | undefined,
    end: CustomDatetimeModel | undefined,
    options: SelectItem<ProjectOptionEnum>[],
}
