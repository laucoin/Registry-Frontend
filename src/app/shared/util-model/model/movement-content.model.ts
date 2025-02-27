import { ParticipantModel } from './participant.model'
import { VehicleModel } from './vehicle.model'

export interface MovementContentModel {
    poolName: string | undefined
    participant: ParticipantModel
    vehicle: VehicleModel | undefined
}
