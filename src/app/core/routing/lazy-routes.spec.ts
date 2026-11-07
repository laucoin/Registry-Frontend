import { Route, Routes } from '@angular/router';

import { describe, expect, it } from 'vitest';

import { routes } from '@core/routing/registry.routes';

interface Loaded {
	component: boolean;
	children: Routes | undefined;
}

async function load(route: Route): Promise<Loaded> {
	const component = route.loadComponent ? await (route.loadComponent as () => Promise<unknown>)() : undefined;
	const children = route.loadChildren ? await (route.loadChildren as () => Promise<Routes>)() : undefined;
	return { component: component !== undefined, children };
}

async function walk(candidates: Routes): Promise<Loaded[]> {
	const loaded = await Promise.all(
		candidates.map(async (route) => {
			const own = await load(route);
			const nested = await walk([...(route.children ?? []), ...(own.children ?? [])]);
			return route.loadComponent || route.loadChildren ? [own, ...nested] : nested;
		}),
	);
	return loaded.flat();
}

describe('lazy routes', () => {
	it('resolves every lazy component and every lazy child route of the application', async () => {
		// Arrange
		const minimumLoaders = 10;

		// Act
		const loaded = await walk(routes);

		// Assert
		expect(loaded.length).toBeGreaterThanOrEqual(minimumLoaders);
		expect(loaded.every((it) => it.component || (it.children?.length ?? 0) > 0)).toBe(true);
	});
});
