import { HistoryUserModel } from '@shared/models/model/history-user.model'
import { HistoryUserResponseDto } from '@shared/models/dto/response/history-user.response.dto'

/**
 * Purpose: Convertit une réponse HistoryUser du backend en modèle HistoryUser.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class HistoryUserMapper {
    public static toModel (dto: HistoryUserResponseDto): HistoryUserModel {
        return {
            id: dto.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
        }
    }
}
