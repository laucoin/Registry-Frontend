import { MovementModel } from '@shared/models/model/movement.model'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { ActivityMapper } from '@shared/mappers/activity.mapper'
import { GenericMapper } from '@shared/mappers/generic.mapper'
import { MovementContentMapper } from '@shared/mappers/movement-content.mapper'
import { MovementReasonMapper } from '@shared/mappers/movement-reason.mapper'

/**
 * Purpose: Convertit une réponse Movement du backend en modèle Movement.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class MovementMapper {
    public static toModel (dto: MovementResponseDto): MovementModel {
        return {
            ...GenericMapper.toModel( dto ),
            dateTime: dto.dateTime,
            type: dto.type,
            reason: dto.reason ? MovementReasonMapper.toModel( dto.reason ) : undefined,
            lastCommunicationDateTime: dto.lastCommunicationDateTime,
            activity: dto.activity ? { ...dto.activity, value: ActivityMapper.toModel( dto.activity.value ) } : undefined,
            contentType: dto.contentType,
            content: dto.content.map( MovementContentMapper.toModel ),
        }
    }
}
