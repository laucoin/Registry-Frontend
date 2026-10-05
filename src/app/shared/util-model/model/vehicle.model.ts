import { SelectItem } from 'primeng/api'
import { PresenceStatusEnum } from '../enumeration/presence-status.enum'
import { CustomDatetimeModel } from './custom-datetime.model'
import { GenericProjectModel } from './generic-project.model'

export interface VehicleModel extends GenericProjectModel {
	licensePlate: string
	brand: string
	model: string
	status: SelectItem<PresenceStatusEnum>
	startAvailability: CustomDatetimeModel | undefined
	endAvailability: CustomDatetimeModel | undefined
}
