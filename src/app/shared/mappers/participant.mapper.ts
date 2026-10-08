import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'
import { GroupMapper } from '@shared/mappers/group.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'

/**
 * Purpose: Converts a Participant response of the backend into the Participant model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class ParticipantMapper {
    public static toModel (dto: ParticipantResponseDto): ParticipantModel {
        return {
            ...GenericProjectMapper.toModel( dto ),
            firstName: dto.firstName,
            lastName: dto.lastName,
            birthday: dto.birthday,
            major: dto.major,
            type: dto.type,
            groups: dto.groups?.map( GroupMapper.toModel ),
            status: dto.status,
            startAvailability: dto.startAvailability,
            endAvailability: dto.endAvailability,
            user: dto.user ? UserMapper.toModel( dto.user ) : undefined,
            purged: dto.purged,
        }
    }
}
