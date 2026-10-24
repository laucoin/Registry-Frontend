import { GenericProjectModel } from '@shared/models/model/generic-project.model'
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Convertit une réponse GenericProject du backend en modèle GenericProject.
 * Scope: Copie chaque champ et conserve l'id du projet auquel l'élément appartient.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class GenericProjectMapper {
    public static toModel (dto: GenericProjectResponseDto): GenericProjectModel {
        return {
            ...GenericMapper.toModel( dto ),
            projectId: dto.projectId,
        }
    }
}
