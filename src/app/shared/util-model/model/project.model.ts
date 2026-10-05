import { SelectItem } from 'primeng/api'
import { AvailabilityStatusEnum } from '../enumeration/availability-status.enum'
import { ProjectOptionEnum } from '../enumeration/project-option.enum'
import { CustomDatetimeModel } from './custom-datetime.model'
import { GenericModel } from './generic.model'

export interface ProjectModel extends GenericModel {
	name: string,
	status: SelectItem<AvailabilityStatusEnum> | undefined
	begin: CustomDatetimeModel | undefined,
	end: CustomDatetimeModel | undefined,
	options: SelectItem<ProjectOptionEnum>[] | undefined,
}
