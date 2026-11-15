import { PreferencesMapper } from '@shared/mappers/preferences.mapper';
import { UserMapper } from '@shared/mappers/user.mapper';
import { CurrentUserResponseDto } from '@shared/models/dto/response/current-user.response.dto';
import { CurrentUserModel } from '@shared/models/model/current-user.model';

/**
 * Objectif: Convertit une réponse CurrentUser du backend en modèle CurrentUser.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const CurrentUserMapper = {
	toModel(dto: CurrentUserResponseDto): CurrentUserModel {
		return {
			...UserMapper.toModel(dto),
			authorities: dto.authorities,
			preferences: PreferencesMapper.toModel(dto.preferences),
		};
	},
} as const;
