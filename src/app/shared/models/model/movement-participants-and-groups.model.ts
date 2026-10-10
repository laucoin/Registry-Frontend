import { ParticipantModel } from '@shared/models/model/participant.model'
import { GroupModel } from '@shared/models/model/group.model'

export interface MovementParticipantsAndGroupsModel {
    participants: ParticipantModel[]
    groups: GroupModel[]
}
