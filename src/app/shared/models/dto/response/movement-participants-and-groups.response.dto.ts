import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'

export interface MovementParticipantsAndGroupsResponseDto {
    participants: ParticipantResponseDto[]
    groups: GroupResponseDto[]
}
