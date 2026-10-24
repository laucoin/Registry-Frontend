import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { CurrentUserResponseDto } from '@shared/models/dto/response/current-user.response.dto'
import { PreferencesMapper } from '@shared/mappers/preferences.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'

/**
 * Purpose: Convertit une réponse CurrentUser du backend en modèle CurrentUser.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class CurrentUserMapper {
    public static toModel (dto: CurrentUserResponseDto): CurrentUserModel {
        return {
            ...UserMapper.toModel( dto ),
            authorities: dto.authorities,
            preferences: PreferencesMapper.toModel( dto.preferences ),
        }
    }
}
