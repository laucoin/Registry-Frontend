import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectOptionResponseDto } from '@shared/models/dto/response/project-option.response.dto'

/**
 * Purpose: Convertit une réponse ProjectOption du backend en modèle ProjectOption.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ProjectOptionMapper {
    public static toModel (dto: ProjectOptionResponseDto): ProjectOptionModel {
        return {
            value: dto.value,
            label: dto.label,
            ask: dto.ask,
            preRequired: dto.preRequired,
        }
    }
}
