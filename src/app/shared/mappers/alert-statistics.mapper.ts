import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model'
import { AlertStatisticsResponseDto } from '@shared/models/dto/response/alert-statistics.response.dto'

/**
 * Purpose: Convertit une réponse AlertStatistics du backend en modèle AlertStatistics.
 * Scope: Copie chaque champ et remplace les valeurs nulles du backend par `undefined`.
 * Limits: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class AlertStatisticsMapper {
    public static toModel (dto: AlertStatisticsResponseDto): AlertStatisticsModel {
        return {
            resolvedCount: dto.resolvedCount,
            canceledCount: dto.canceledCount,
            averageResolutionSeconds: dto.averageResolutionSeconds ?? undefined,
            realAlertRate: dto.realAlertRate ?? undefined,
        }
    }
}
