import { StorageUtils } from '@shared/helpers/storage.helper';

/**
 * Purpose: Accès typé au session storage.
 * Scope: Enveloppe les utilitaires de stockage sur sessionStorage.
 * Limits: Pas pour les données sensibles ; les valeurs vivent jusqu'à la fermeture de l'onglet.
 */
export const SessionStorageUtils = {
	get(key: string): unknown {
		return StorageUtils.get(sessionStorage, key);
	},

	check(key: string): boolean {
		return StorageUtils.check(sessionStorage, key);
	},

	set(key: string, value: unknown): void {
		StorageUtils.set(sessionStorage, key, value);
	},

	delete(key: string): void {
		StorageUtils.delete(sessionStorage, key);
	},

	clear(except?: string[]): void {
		StorageUtils.clear(sessionStorage, except);
	},
} as const;
