import { ParticipantModel } from './participant.model'
import { GroupModel } from './group.model'

export interface MovementParticipantsAndGroupsModel {
    participants: ParticipantModel[]
    groups: GroupModel[]
}
