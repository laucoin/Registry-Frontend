import { of } from 'rxjs';
import { Mock, vi } from 'vitest';

/**
 * Construit un substitut de facade dont les membres sont créés à la première utilisation.
 * Chaque membre est un spy qui renvoie un observable émettant un objet vide, ce qui convient aussi bien aux commandes qu'aux signals lus comme des fonctions.
 */
export function autoMock(...emitted: [] | [unknown]): Record<string, Mock> {
	const value: unknown = emitted.length ? emitted[0] : {};
	const members: Record<string, Mock> = {};
	return new Proxy(members, {
		get: (_: Record<string, Mock>, key: string | symbol): Mock | undefined => {
			if (typeof key !== 'string' || key === 'then') return undefined;
			return (members[key] ??= vi.fn(() => of(value)));
		},
	});
}
