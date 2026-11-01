import { ActivityStatisticsResponseDto } from '@shared/models/dto/response/activity-statistics.response.dto'
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model'

/**
 * Purpose: Convertit une réponse ActivityStatistics du backend en modèle ActivityStatistics.
 * Scope: Copie chaque champ et remplace le taux nul du backend par `undefined`.
 * Limits: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ActivityStatisticsMapper {
    public static toModel (dto: ActivityStatisticsResponseDto): ActivityStatisticsModel {
        return {
            participantCount: dto.participantCount,
            projectParticipantCount: dto.projectParticipantCount,
            participantRate: dto.participantRate ?? undefined,
            movementSeconds: dto.movementSeconds,
            manSeconds: dto.manSeconds,
        }
    }
}
