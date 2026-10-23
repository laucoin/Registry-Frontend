import { ParticipantModel } from '@shared/models/model/participant.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

export interface MovementContentModel {
    poolName: string | undefined
    participant: ParticipantModel
    vehicle: VehicleModel | undefined
}
