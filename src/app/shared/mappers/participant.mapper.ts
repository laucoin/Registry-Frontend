import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'
import { GroupMapper } from '@shared/mappers/group.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'

/**
 * Purpose: Convertit une réponse Participant du backend en modèle Participant.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ParticipantMapper {
    public static toModel (dto: ParticipantResponseDto): ParticipantModel {
        return {
            ...GenericMapper.toModel( dto ),
            firstName: dto.firstName,
            lastName: dto.lastName,
            birthday: dto.birthday,
            major: dto.major,
            type: dto.type,
            groups: dto.groups?.map( GroupMapper.toModel ),
            status: dto.status,
            startAvailability: dto.startAvailability,
            endAvailability: dto.endAvailability,
            effectiveArrival: dto.effectiveArrival,
            effectiveDeparture: dto.effectiveDeparture,
            user: dto.user ? UserMapper.toModel( dto.user ) : undefined,
        }
    }
}
