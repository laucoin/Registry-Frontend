import { GenericMapper } from '@shared/mappers/generic.mapper';
import { CurrentProjectProfileResponseDto } from '@shared/models/dto/response/current-project-profile.response.dto';
import { CurrentProjectProfileModel } from '@shared/models/model/current-project-profile.model';

/**
 * Objectif: Convertit la réponse de profil de l'utilisateur courant sur un projet en son modèle.
 * Périmètre: Copie chaque champ.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const CurrentProjectProfileMapper = {
	toModel(dto: CurrentProjectProfileResponseDto): CurrentProjectProfileModel {
		return {
			...GenericMapper.toModel(dto),
			role: dto.role,
			availabilityStatus: dto.availabilityStatus,
			status: dto.status,
			startAccess: dto.startAccess,
			endAccess: dto.endAccess,
		};
	},
} as const;
