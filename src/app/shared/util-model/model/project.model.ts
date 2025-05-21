import { GenericModel } from './generic.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from './custom-datetime.model'
import { ProjectOptionEnum } from '../enumeration/project-option.enum'
import { AvailabilityStatusEnum } from '../enumeration/availability-status.enum'

export interface ProjectModel extends GenericModel {
    name: string,
    status: SelectItem<AvailabilityStatusEnum> | undefined
    begin: CustomDatetimeModel | undefined,
    end: CustomDatetimeModel | undefined,
    options: SelectItem<ProjectOptionEnum>[] | undefined,
}
