import { FeaturesResponseDto } from '@shared/models/dto/response/features.response.dto';
import { FeaturesModel } from '@shared/models/model/features.model';

/**
 * Objectif: Convertit la réponse des fonctionnalités activées du backend en modèle.
 * Périmètre: Copie chaque indicateur de fonctionnalité.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const FeaturesMapper = {
	toModel(dto: FeaturesResponseDto): FeaturesModel {
		return { inviteByEmail: dto.inviteByEmail };
	},
} as const;
