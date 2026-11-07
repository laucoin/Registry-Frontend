/**
 * Purpose: Vérifications de nullité partagées dans l'application.
 * Scope: Fournit isNull et nonNull, qui réduisent le type de la valeur testée, et require pour une valeur déjà garantie par la validation.
 * Limits: Rien d'autre ; l'accès au navigateur vit dans le service du navigateur.
 */
export const GenericHelper = {
	isNull: (value: unknown): value is null | undefined => value == undefined,
	nonNull: <T>(value: T | null | undefined): value is T => value != undefined,
	require<T>(value: T | null | undefined, name: string): T {
		if (value == undefined) throw new Error(`Missing required value: ${name}`);
		return value;
	},
} as const;
