import { GroupMapper } from '@shared/mappers/group.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { MovementParticipantsAndGroupsResponseDto } from '@shared/models/dto/response/movement-participants-and-groups.response.dto'
import { MovementParticipantsAndGroupsModel } from '@shared/models/model/movement-participants-and-groups.model'

/**
 * Purpose: Converts the participants and groups found by a search into their model.
 * Scope: Delegates each participant and each group to its own mapper.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class MovementParticipantsAndGroupsMapper {
    public static toModel (dto: MovementParticipantsAndGroupsResponseDto): MovementParticipantsAndGroupsModel {
        return {
            participants: dto.participants.map( ParticipantMapper.toModel ),
            groups: dto.groups.map( GroupMapper.toModel ),
        }
    }
}
