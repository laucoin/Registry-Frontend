import { GenericModel } from '@shared/models/model/generic.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface ProjectModel extends GenericModel {
    name: string,
    status: SelectItem<AvailabilityStatusEnum> | undefined
    begin: CustomDatetimeModel | undefined,
    end: CustomDatetimeModel | undefined,
    options: SelectItem<ProjectOptionEnum>[] | undefined,
}
