import { PreferencesResponseDto } from '@shared/models/dto/response/preferences.response.dto';
import { PreferencesModel } from '@shared/models/model/preferences.model';

/**
 * Purpose: Convertit une réponse Preferences du backend en modèle Preferences.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const PreferencesMapper = {
	toModel(dto: PreferencesResponseDto): PreferencesModel {
		return {
			userId: dto.userId,
			theme: dto.theme,
			language: dto.language,
			refreshMode: dto.refreshMode,
		};
	},
} as const;
