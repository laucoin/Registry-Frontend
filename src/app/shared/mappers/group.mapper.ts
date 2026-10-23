import { GroupModel } from '@shared/models/model/group.model'
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'

/**
 * Purpose: Converts a Group response of the backend into the Group model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class GroupMapper {
    public static toModel (dto: GroupResponseDto): GroupModel {
        return {
            ...GenericProjectMapper.toModel( dto ),
            name: dto.name,
            status: dto.status,
            startAvailability: dto.startAvailability,
            endAvailability: dto.endAvailability,
            membersCount: dto.membersCount,
            insideMembersCount: dto.insideMembersCount,
            outsideMembersCount: dto.outsideMembersCount,
            members: dto.members?.map( ParticipantMapper.toModel ),
        }
    }
}
