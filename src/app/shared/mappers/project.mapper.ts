import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'
import { CurrentProjectProfileMapper } from '@shared/mappers/current-project-profile.mapper'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Convertit une réponse Project du backend en modèle Project.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ProjectMapper {
    public static toModel (dto: ProjectResponseDto): ProjectModel {
        return {
            ...GenericMapper.toModel( dto ),
            name: dto.name,
            status: dto.status,
            begin: dto.begin,
            end: dto.end,
            options: dto.options,
            counts: dto.counts ? { ...dto.counts } : undefined,
            favorite: dto.favorite,
            profile: dto.profile ? CurrentProjectProfileMapper.toModel( dto.profile ) : undefined,
        }
    }
}
