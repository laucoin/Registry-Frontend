import { ParamMap, Params } from '@angular/router'
import { SearchQueryExtra } from '@shared/helpers/search/search-query'

export type SortDirection = 'asc' | 'desc'

export interface SortFields {
    sortBy: string
    sortDirection: SortDirection
}

export const SORT_QUERY_PARAM: string = 'sort'

const DESCENDING_PREFIX: string = '-'

export const DEFAULT_SORT: SortFields = { sortBy: '', sortDirection: 'asc' }

/**
 * Purpose: Convertit la valeur `sort` du backend (`champ` ou `-champ`) en champ et sens de tri du formulaire de recherche.
 * Scope: Le préfixe `-` donne le sens décroissant ; un champ absent de la liste autorisée ou une valeur vide donne le tri par défaut.
 * Limits: Ne gère qu'un seul champ de tri.
 */
export function parseSort (raw: string | null | undefined, allowed: readonly string[]): SortFields {
    const descending: boolean = raw?.startsWith(DESCENDING_PREFIX) ?? false
    const field: string = descending ? raw!.slice(DESCENDING_PREFIX.length) : raw ?? ''
    return allowed.includes(field) ? { sortBy: field, sortDirection: descending ? 'desc' : 'asc' } : DEFAULT_SORT
}

/**
 * Purpose: Convertit le champ et le sens de tri du formulaire de recherche en valeur `sort` du backend.
 * Scope: Renvoie undefined quand aucun champ n'est choisi, donc quand le tri par défaut du backend s'applique.
 * Limits: Ne valide pas le champ.
 */
export function formatSort (fields: SortFields): string | undefined {
    if (fields.sortBy === '') {
        return undefined
    }
    return fields.sortDirection === 'desc' ? `${DESCENDING_PREFIX}${fields.sortBy}` : fields.sortBy
}

/**
 * Purpose: Relie le champ et le sens de tri d'un formulaire de recherche au query param `sort`.
 * Scope: Lit `sort` dans l'URL avec les champs autorisés et l'écrit sous la forme `champ` ou `-champ`, absent par défaut.
 * Limits: Le modèle du formulaire doit porter `sortBy` et `sortDirection`.
 */
export function sortQueryCodec<T extends SortFields> (allowed: readonly string[]): SearchQueryExtra<T> {
    return {
        read: (query: ParamMap, parsed: T): T => ({ ...parsed, ...parseSort(query.get(SORT_QUERY_PARAM), allowed) }),
        write: (model: T): Params => ({ [SORT_QUERY_PARAM]: formatSort(model) ?? null }),
    }
}
