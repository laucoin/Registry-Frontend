import { ActivityModel } from '@shared/models/model/activity.model'
import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Convertit une réponse Activity du backend en modèle Activity.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ActivityMapper {
    public static toModel (dto: ActivityResponseDto): ActivityModel {
        return {
            ...GenericMapper.toModel( dto ),
            name: dto.name,
            status: dto.status,
            description: dto.description,
            duration: dto.duration,
            allowedParticipants: dto.allowedParticipants,
            startAvailability: dto.startAvailability,
            endAvailability: dto.endAvailability,
        }
    }
}
