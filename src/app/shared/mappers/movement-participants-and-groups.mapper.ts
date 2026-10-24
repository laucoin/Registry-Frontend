import { GroupMapper } from '@shared/mappers/group.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { MovementParticipantsAndGroupsResponseDto } from '@shared/models/dto/response/movement-participants-and-groups.response.dto'
import { MovementParticipantsAndGroupsModel } from '@shared/models/model/movement-participants-and-groups.model'

/**
 * Purpose: Convertit les participants et groupes trouvés par une recherche en leur modèle.
 * Scope: Délègue chaque participant et chaque groupe à son propre mapper.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class MovementParticipantsAndGroupsMapper {
    public static toModel (dto: MovementParticipantsAndGroupsResponseDto): MovementParticipantsAndGroupsModel {
        return {
            participants: dto.participants.map( ParticipantMapper.toModel ),
            groups: dto.groups.map( GroupMapper.toModel ),
        }
    }
}
