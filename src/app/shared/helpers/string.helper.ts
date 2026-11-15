import { GenericHelper } from '@shared/helpers/generic.helper';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const EMAIL_MAX_LENGTH = 320;

/**
 * Objectif: Utilitaires de chaînes.
 * Périmètre: Invalidation de cache, troncature, vérifications de blancs, conversion de nombres, remplissage de chiffres,
 * casse de titre et initiales.
 * Limites: Aucune traduction et aucun accès au navigateur.
 */
export const StringHelper = {
	initials(text: string, maxLength: number): string {
		const words = text.trim().split(/\s+/);
		const letters = words.length > 1 ? words.map((word) => Array.from(word)[0]) : Array.from(words[0]);
		return letters.slice(0, maxLength).join('').toUpperCase();
	},

	addCacheBustingToUrl(url: string): string {
		const separator: string = url.includes('?') ? '&' : '?';
		return `${url}${separator}cache-bust=${Math.random()}`;
	},

	truncate(text: string | undefined, maxLength: number, tail?: string): string {
		if (GenericHelper.isNull(text)) return '';
		if (text.length > maxLength) return text.substring(0, maxLength) + (tail ?? '');
		return text;
	},

	isBlank(text: string | undefined): boolean {
		if (GenericHelper.isNull(text)) return false;
		return text.trim().length === 0;
	},

	isNullOrBlank(text: string | undefined): boolean {
		return GenericHelper.isNull(text) || text.trim().length === 0;
	},

	isNotNullNorBlank(text: string | undefined): text is string {
		return !this.isNullOrBlank(text);
	},

	isEmail(text: string | undefined): boolean {
		return !GenericHelper.isNull(text) && text.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(text);
	},

	toNumber(value: number | string | null | undefined): number | undefined {
		switch (true) {
			case GenericHelper.isNull(value):
				return undefined;
			case typeof value == 'string': {
				const parsed = Number.parseFloat(value as string);
				return Number.isNaN(parsed) ? undefined : parsed;
			}
			default:
				return value;
		}
	},

	formatDigits(value: number, range: number): string {
		return value.toString().padStart(range, '0');
	},
} as const;
