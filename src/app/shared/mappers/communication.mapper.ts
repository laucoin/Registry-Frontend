import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { AlertMapper } from '@shared/mappers/alert.mapper'
import { GenericMapper } from '@shared/mappers/generic.mapper'
import { MovementMapper } from '@shared/mappers/movement.mapper'

/**
 * Purpose: Convertit une réponse Communication du backend en modèle Communication.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class CommunicationMapper {
    public static toModel (dto: CommunicationResponseDto): CommunicationModel {
        return {
            ...GenericMapper.toModel( dto ),
            dateTime: dto.dateTime,
            message: dto.message,
            movement: dto.movement ? MovementMapper.toModel( dto.movement ) : undefined,
            alert: dto.alert ? AlertMapper.toModel( dto.alert ) : undefined,
        }
    }
}
