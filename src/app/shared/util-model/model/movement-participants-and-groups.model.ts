import { GroupModel } from './group.model'
import { ParticipantModel } from './participant.model'

export interface MovementParticipantsAndGroupsModel {
	participants: ParticipantModel[]
	groups: GroupModel[]
}
