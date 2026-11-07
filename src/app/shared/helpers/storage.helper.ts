import { GenericHelper } from '@shared/helpers/generic.helper';
import { Utils } from '@shared/helpers/json.helper';

/**
 * Purpose: Accès typé à un objet Web Storage.
 * Scope: Lit, écrit, vérifie, supprime et vide tout en préservant les objets au format JSON.
 * Limits: Ne stocke que des chaînes et des objets ; les autres valeurs sont stockées comme texte vide.
 */
export const StorageUtils = {
	get(storage: Storage, key: string): unknown {
		const item = storage.getItem(key);
		return Utils.isJson(item) ? JSON.parse(item) : item;
	},

	check(storage: Storage, key: string): boolean {
		return GenericHelper.nonNull(this.get(storage, key));
	},

	set(storage: Storage, key: string, value: unknown): void {
		storage.setItem(key, Utils.isObject(value) ? JSON.stringify(value) : typeof value == 'string' ? value : '');
	},

	delete(storage: Storage, key: string): void {
		storage.removeItem(key);
	},

	clear(storage: Storage, except?: string[]): void {
		const keep: unknown[] = [];
		if (except && except.length > 0) {
			keep.push(...except.map((key) => this.get(storage, key)));
		}

		storage.clear();

		if (except && except?.length > 0) {
			except.forEach((key, index) => {
				const value: unknown = keep[index];
				if (value) {
					this.set(storage, key, value);
				}
			});
		}
	},
} as const;
