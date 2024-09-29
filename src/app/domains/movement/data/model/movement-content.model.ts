import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GenericModel } from '../../../../shared/util-model/model/generic.model'

export interface MovementContentModel extends GenericModel {
    participant: ParticipantModel
}
