import { HistoryMapper } from '@shared/mappers/history.mapper';
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto';
import { GenericModel } from '@shared/models/model/generic.model';

/**
 * Purpose: Convertit une réponse Generic du backend en modèle Generic.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const GenericMapper = {
	toModel(dto: GenericResponseDto): GenericModel {
		return {
			id: dto.id,
			visible: dto.visible,
			creation: dto.creation ? HistoryMapper.toModel(dto.creation) : undefined,
			lastEdition: dto.lastEdition ? HistoryMapper.toModel(dto.lastEdition) : undefined,
		};
	},
} as const;
