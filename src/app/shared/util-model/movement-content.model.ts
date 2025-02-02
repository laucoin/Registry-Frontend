import { ParticipantModel } from './model/participant.model'

export interface MovementContentModel {
    poolName: string | undefined
    participant: ParticipantModel
}
