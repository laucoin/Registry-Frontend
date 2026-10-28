import { CurrentProjectProfileModel } from '@shared/models/model/current-project-profile.model'
import { CurrentProjectProfileResponseDto } from '@shared/models/dto/response/current-project-profile.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Convertit la réponse de profil de l'utilisateur courant sur un projet en son modèle.
 * Scope: Copie chaque champ.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class CurrentProjectProfileMapper {
    public static toModel (dto: CurrentProjectProfileResponseDto): CurrentProjectProfileModel {
        return {
            ...GenericMapper.toModel( dto ),
            role: dto.role,
            availabilityStatus: dto.availabilityStatus,
            status: dto.status,
            startAccess: dto.startAccess,
            endAccess: dto.endAccess,
        }
    }
}
