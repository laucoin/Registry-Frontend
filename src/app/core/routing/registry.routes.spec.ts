import { Route } from '@angular/router';

import { describe, expect, it } from 'vitest';

import { routes } from '@core/routing/registry.routes';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';

describe('routes', () => {
	function flatten(candidates: Route[]): Route[] {
		return candidates.flatMap((route) => [route, ...flatten(route.children ?? [])]);
	}

	function lazyRoutes(): Route[] {
		return flatten(routes).filter((route) => !!route.loadComponent || !!route.loadChildren);
	}

	it('loads the login, auth callback, home, account, users, projects, privacy and terms areas lazily', () => {
		// Arrange
		const expected = [
			RegistryRouteEnum.LOGIN,
			RegistryRouteEnum.AUTH_CALLBACK,
			'',
			RegistryRouteEnum.MY_ACCOUNT,
			RegistryRouteEnum.PROJECTS,
			RegistryRouteEnum.USERS,
			RegistryRouteEnum.PRIVACY,
			RegistryRouteEnum.TERMS,
		];

		// Act
		const paths = lazyRoutes().map((route) => route.path);

		// Assert
		expect(paths).toEqual(expected);
	});

	it('resolves the lazy pages of the login, auth callback, account, privacy and terms routes', async () => {
		// Arrange
		const loaders = lazyRoutes()
			.filter((route) => !!route.loadComponent)
			.map((route) => route.loadComponent as () => Promise<unknown>);

		// Act
		const pages = await Promise.all(loaders.map((load) => load()));

		// Assert
		expect(pages.map((page): string => typeof page)).toEqual(['function', 'function', 'function', 'function']);
	});

	it('guards the signed-in areas', () => {
		// Arrange
		const guarded: string[] = [RegistryRouteEnum.MY_ACCOUNT, RegistryRouteEnum.PROJECTS, RegistryRouteEnum.USERS];

		// Act
		const unguarded: string[] = guarded.filter(
			(path: string) => !flatten(routes).find((route) => route.path === path)?.canActivate?.length,
		);

		// Assert
		expect(unguarded).toEqual([]);
	});

	it('guards the home page and sends unknown paths to it', () => {
		// Arrange
		const all = flatten(routes);

		// Act
		const home = all.find((route) => route.path === '' && route.pathMatch === 'full');
		const fallback = all.find((route) => route.path === '**');

		// Assert
		expect(home?.canActivate?.length).toBeGreaterThan(0);
		expect(fallback?.redirectTo).toBe('');
	});
});
