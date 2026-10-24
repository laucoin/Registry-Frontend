import { HistoryModel } from '@shared/models/model/history.model'
import { HistoryResponseDto } from '@shared/models/dto/response/history.response.dto'
import { HistoryUserMapper } from '@shared/mappers/history-user.mapper'

/**
 * Purpose: Convertit une réponse History du backend en modèle History.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class HistoryMapper {
    public static toModel (dto: HistoryResponseDto): HistoryModel {
        return {
            dateTime: dto.dateTime,
            user: dto.user ? HistoryUserMapper.toModel( dto.user ) : undefined,
        }
    }
}
