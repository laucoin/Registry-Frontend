/**
 * Purpose: Garantit dans un test qu'une valeur est présente et réduit son type.
 * Scope: Lève une erreur explicite quand la valeur est absente, au lieu de laisser un `!` la masquer.
 * Limits: Réservé aux tests ; ne remplace pas la validation des données du code applicatif.
 */
export function defined<T>(value: T | null | undefined): T {
	if (value == undefined) throw new Error('Expected the value to be defined');
	return value;
}
