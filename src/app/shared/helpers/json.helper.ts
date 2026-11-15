import { GenericHelper } from '@shared/helpers/generic.helper';

/**
 * Objectif: Utilitaires de détection de JSON.
 * Périmètre: Indique si un texte est un objet JSON et si une valeur est un objet.
 * Limites: N'analyse pas à la place des appelants.
 */
export const Utils = {
	isJson(item: string | null): item is string {
		let value = item || '';

		try {
			value = JSON.parse(value);
		} catch {
			return false;
		}

		return typeof value === 'object' && GenericHelper.nonNull(value);
	},

	isObject(item: unknown): boolean {
		return typeof item === 'object' && GenericHelper.nonNull(item);
	},
} as const;
