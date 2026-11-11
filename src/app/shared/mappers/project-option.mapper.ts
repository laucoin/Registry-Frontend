import { ProjectOptionResponseDto } from '@shared/models/dto/response/project-option.response.dto';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

/**
 * Objectif: Convertit une réponse ProjectOption du backend en modèle ProjectOption.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const ProjectOptionMapper = {
	toModel(dto: ProjectOptionResponseDto): ProjectOptionModel {
		return {
			value: dto.value,
			label: dto.label,
			ask: dto.ask,
			preRequired: dto.preRequired,
		};
	},
} as const;
