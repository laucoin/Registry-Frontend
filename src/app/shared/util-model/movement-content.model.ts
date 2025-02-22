import { ParticipantModel } from './model/participant.model'
import { VehicleModel } from './model/vehicle.model'

export interface MovementContentModel {
    poolName: string | undefined
    participant: ParticipantModel
    vehicle: VehicleModel | undefined
}
