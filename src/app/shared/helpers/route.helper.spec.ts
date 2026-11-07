import { describe, expect, it } from 'vitest';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { RouteHelper } from '@shared/helpers/route.helper';

describe('RouteHelper', () => {
	it('prefixes a simple route with a slash', () => {
		// Arrange
		const route: RegistryRouteEnum = RegistryRouteEnum.LOGIN;

		// Act
		const url = RouteHelper.absolute(route);

		// Assert
		expect(url).toBe('/login');
	});

	it('keeps the nested segments of a composed route', () => {
		// Arrange
		const route: RegistryRouteEnum = RegistryRouteEnum.MY_ACCOUNT_INVITATIONS;

		// Act
		const url = RouteHelper.absolute(route);

		// Assert
		expect(url).toBe(`/${RegistryRouteEnum.MY_ACCOUNT_INVITATIONS}`);
	});

	it.each([
		['/users/u1/edit', '/users?q=ada&isVisible=false', '/users/u1/edit?q=ada&isVisible=false'],
		['/users/u1/edit', '/users?q=ada#top', '/users/u1/edit?q=ada'],
		['/users/u1/edit', '/users', '/users/u1/edit'],
		['/users/u1/edit', undefined, '/users/u1/edit'],
	])('carries the query string of the current url over to %s from %s', (url, currentUrl, expected) => {
		// Arrange
		// Act
		const target = RouteHelper.preservingQuery(url, currentUrl);

		// Assert
		expect(target).toBe(expected);
	});
});
