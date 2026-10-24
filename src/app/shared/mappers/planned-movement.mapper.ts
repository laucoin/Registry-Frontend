import { MovementReasonMapper } from '@shared/mappers/movement-reason.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { PlannedMovementResponseDto } from '@shared/models/dto/response/planned-movement.response.dto'
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model'

/**
 * Purpose: Convertit une réponse de mouvement prévu du backend en modèle de mouvement prévu.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class PlannedMovementMapper {
    public static toModel (dto: PlannedMovementResponseDto): PlannedMovementModel {
        return {
            type: dto.type,
            reason: dto.reason ? MovementReasonMapper.toModel( dto.reason ) : undefined,
            contentType: dto.contentType,
            plannedAt: dto.plannedAt,
            poolName: dto.poolName,
            participants: dto.participants.map( ParticipantMapper.toModel ),
        }
    }
}
