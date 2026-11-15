/**
 * Objectif: Petits utilitaires de tableaux.
 * Périmètre: Vérification d'inclusion qui traite une valeur manquante comme satisfaite, vérification de vide et découpage en blocs.
 * Limites: Pas une bibliothèque de tableaux généraliste.
 */
export const ArrayHelper = {
	includes(array: unknown[], value: unknown, strict = false): boolean {
		if (strict) return array.includes(value);
		if (!value) return true;
		return !ArrayHelper.isNullOrEmpty(array) && array.includes(value);
	},

	isNullOrEmpty<T>(array: T[] | undefined): array is undefined | [] {
		return !array || array.length === 0;
	},

	chunk<T>(array: T[] | undefined, size: number): T[][] {
		if (ArrayHelper.isNullOrEmpty(array)) return [[]];
		return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
			array.slice(index * size, (index + 1) * size),
		);
	},
} as const;
