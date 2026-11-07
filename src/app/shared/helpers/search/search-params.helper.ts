/**
 * Purpose: Détecte si de nouveaux paramètres de recherche diffèrent de ceux déjà enregistrés dans un store.
 * Scope: Compare chaque paramètre fourni à sa valeur enregistrée, une valeur absente valant `undefined`.
 * Limits: Ne convertit rien (les dates sont déjà au format ISO) et ne met aucun état à jour.
 */
export const SearchParamsHelper = {
	hasChanged<P extends object>(current: P, next: Partial<P>): boolean {
		return (Object.keys(next) as (keyof P)[]).some((key) => current[key] != next[key]);
	},
} as const;
