import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import { GenericProjectModel } from '../../../../../shared/util-model/model/generic-project.model'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'

export interface CommunicationModel extends GenericProjectModel {
	dateTime: Date
	message: string | undefined
	movement: MovementModel | undefined
	alert: AlertModel | undefined
}
