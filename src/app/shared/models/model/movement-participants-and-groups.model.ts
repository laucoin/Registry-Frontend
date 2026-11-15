import { GroupModel } from '@shared/models/model/group.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

export interface MovementParticipantsAndGroupsModel {
	participants: ParticipantModel[];
	groups: GroupModel[];
}
