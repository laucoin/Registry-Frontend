import { OptionalProjectModel } from '@shared/models/model/generic-project.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'

export interface CommunicationModel extends OptionalProjectModel {
    dateTime: Date
    message: string | undefined
    movement: MovementModel | undefined
    alert: AlertModel | undefined
}
