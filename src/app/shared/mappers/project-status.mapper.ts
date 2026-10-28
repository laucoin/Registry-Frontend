import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { ProjectStatusResponseDto } from '@shared/models/dto/response/project-status.response.dto'

/**
 * Purpose: Convertit une réponse ProjectStatus du backend en modèle ProjectStatus.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ProjectStatusMapper {
    public static toModel (dto: ProjectStatusResponseDto): ProjectStatusModel {
        return {
            registered: dto.registered,
            guests: dto.guests,
            lastRefresh: dto.lastRefresh,
        }
    }
}
