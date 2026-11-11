import { GenericModel } from '@shared/models/model/generic.model';
import { PageModel } from '@shared/models/model/page.model';

export interface CumulativePageRequest {
	page: number | undefined;
	size: number | undefined;
	batchSize?: number;
}

const MAX_PAGE_SIZE = 200;

function reloadSize(current: PageModel<GenericModel>): number {
	const wholeBatches = Math.max(1, Math.floor(MAX_PAGE_SIZE / current.size));
	return current.size * Math.min(current.page + 1, wholeBatches);
}

function appended<M extends GenericModel>(current: PageModel<M>, fetched: PageModel<M>): PageModel<M> {
	return {
		...fetched,
		size: current.size,
		content: [...current.content, ...fetched.content],
	};
}

function rebuilt<M extends GenericModel>(
	current: PageModel<M> | undefined,
	fetched: PageModel<M>,
	batchSize: number,
): PageModel<M> {
	if (current && current.content.length > fetched.content.length) {
		return {
			...fetched,
			size: batchSize,
			page: current.page,
			hasNext: current.hasNext,
			totalPages: Math.ceil(fetched.totalElements / batchSize),
			content: [...fetched.content, ...current.content.slice(fetched.content.length)],
		};
	}
	const batches = Math.max(1, Math.ceil(fetched.content.length / batchSize));
	return {
		...fetched,
		size: batchSize,
		page: batches - 1,
		totalPages: Math.ceil(fetched.totalElements / batchSize),
	};
}

/**
 * Objectif: Construit la page affichée par une liste qui charge ses éléments lot après lot.
 * Périmètre: Ajoute un lot fraîchement récupéré à la page déjà affichée, ou reconstruit la page affichée à partir d'une seule requête de rechargement.
 * Limites: Fonctions pures ; un rechargement ne demande jamais plus de lignes que le plafond de taille de page du backend, donc seules les lignes sous ce plafond sont rafraîchies et celles au-delà sont conservées telles qu'affichées.
 */
export const CumulativePageHelper = {
	merge<M extends GenericModel>(
		current: PageModel<M> | undefined,
		fetched: PageModel<M>,
		request: CumulativePageRequest,
	): PageModel<M> {
		if (request.batchSize !== undefined) {
			return rebuilt(current, fetched, request.batchSize);
		}
		if (current && request.page === current.page + 1) {
			return appended(current, fetched);
		}
		return fetched;
	},

	reloadRequest(current: PageModel<GenericModel> | undefined): CumulativePageRequest {
		if (!current) {
			return { page: undefined, size: undefined };
		}
		return {
			page: 0,
			size: reloadSize(current),
			batchSize: current.size,
		};
	},

	hasMore(page: PageModel<GenericModel> | undefined): boolean {
		return !!page && page.hasNext;
	},
} as const;
