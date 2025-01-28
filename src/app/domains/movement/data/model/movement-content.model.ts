import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'

export interface MovementContentModel {
    poolName: string | undefined
    participant: ParticipantModel
}
