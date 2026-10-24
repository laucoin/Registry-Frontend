import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'

/**
 * Purpose: Convertit une réponse ProjectProfile du backend en modèle ProjectProfile.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ProjectProfileMapper {
    public static toModel (dto: ProjectProfileResponseDto): ProjectProfileModel {
        return {
            ...GenericProjectMapper.toModel( dto ),
            user: UserMapper.toModel( dto.user ),
            role: dto.role,
            availabilityStatus: dto.availabilityStatus,
            status: dto.status,
            startAccess: dto.startAccess,
            endAccess: dto.endAccess,
        }
    }
}
