import { FeaturesResponseDto } from '@shared/models/dto/response/features.response.dto';
import { FeaturesModel } from '@shared/models/model/features.model';

/**
 * Purpose: Convertit la réponse des fonctionnalités activées du backend en modèle.
 * Scope: Copie chaque indicateur de fonctionnalité.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const FeaturesMapper = {
	toModel(dto: FeaturesResponseDto): FeaturesModel {
		return { inviteByEmail: dto.inviteByEmail };
	},
} as const;
