import { GenericModel } from '@shared/models/model/generic.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface ProjectModel extends GenericModel {
    name: string,
    status: SelectOptionModel<AvailabilityStatusEnum> | undefined
    begin: CustomDatetimeModel | undefined,
    end: CustomDatetimeModel | undefined,
    options: SelectOptionModel<ProjectOptionEnum>[] | undefined,
}
