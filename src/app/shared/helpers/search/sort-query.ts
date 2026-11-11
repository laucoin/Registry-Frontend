import { Params } from '@angular/router';

import { SearchQueryExtra } from '@shared/helpers/search/search-query';
import { SortDirectionEnum } from '@shared/models/enumeration/sort-direction.enum';

export interface SortFields {
	sortBy: string;
	sortDirection: SortDirectionEnum;
}

export const SORT_QUERY_PARAM = 'sort';

const DESCENDING_PREFIX = '-';

export const DEFAULT_SORT: SortFields = { sortBy: '', sortDirection: SortDirectionEnum.ASC };

/**
 * Objectif: Convertit la valeur `sort` du backend (`champ` ou `-champ`) en champ et sens de tri du formulaire de recherche.
 * Périmètre: Le préfixe `-` donne le sens décroissant ; un champ absent de la liste autorisée ou une valeur vide donne le tri par défaut.
 * Limites: Ne gère qu'un seul champ de tri.
 */
export function parseSort(raw: string | null | undefined, allowed: readonly string[]): SortFields {
	const value = raw ?? '';
	const descending = value.startsWith(DESCENDING_PREFIX);
	const field = descending ? value.slice(DESCENDING_PREFIX.length) : value;
	return allowed.includes(field)
		? { sortBy: field, sortDirection: descending ? SortDirectionEnum.DESC : SortDirectionEnum.ASC }
		: DEFAULT_SORT;
}

/**
 * Objectif: Convertit le champ et le sens de tri du formulaire de recherche en valeur `sort` du backend.
 * Périmètre: Renvoie undefined quand aucun champ n'est choisi, donc quand le tri par défaut du backend s'applique.
 * Limites: Ne valide pas le champ.
 */
export function formatSort(fields: SortFields): string | undefined {
	if (fields.sortBy === '') {
		return undefined;
	}
	return fields.sortDirection === SortDirectionEnum.DESC ? `${DESCENDING_PREFIX}${fields.sortBy}` : fields.sortBy;
}

/**
 * Objectif: Relie le champ et le sens de tri d'un formulaire de recherche au query param `sort`.
 * Périmètre: Lit `sort` dans l'URL avec les champs autorisés et l'écrit sous la forme `champ` ou `-champ`, absent par défaut.
 * Limites: Le modèle du formulaire doit porter `sortBy` et `sortDirection`.
 */
export function sortQueryCodec<T extends SortFields>(allowed: readonly string[]): SearchQueryExtra<T> {
	return {
		read: (query, parsed): T => ({ ...parsed, ...parseSort(query.get(SORT_QUERY_PARAM), allowed) }),
		write: (model): Params => ({ [SORT_QUERY_PARAM]: formatSort(model) ?? null }),
	};
}
