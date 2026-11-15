import { PageResponseDto } from '@shared/models/dto/response/page.response.dto';
import { GenericModel } from '@shared/models/model/generic.model';
import { PageModel } from '@shared/models/model/page.model';

/**
 * Objectif: Convertit une réponse de page du backend en modèle de page.
 * Périmètre: Copie les champs de pagination et convertit chaque élément avec le mapper d'élément donné.
 * Limites: Ne connaît pas le type d'élément ; l'appelant fournit son mapper.
 */
export const PageMapper = {
	toModel<D, M extends GenericModel>(dto: PageResponseDto<D>, mapContent: (element: D) => M): PageModel<M> {
		return {
			page: dto.page,
			size: dto.size,
			totalElements: dto.totalElements,
			totalPages: dto.totalPages,
			hasNext: dto.hasNext,
			content: dto.content.map(mapContent),
			lastRefresh: dto.lastRefresh,
		};
	},
} as const;
