import { Route } from '@angular/router';

import { describe, expect, it } from 'vitest';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { InvitationsListPage } from '@pages/my-account/invitations/invitations-list.page';
import { MyAccountPage } from '@pages/my-account/my-account.page';
import { myAccountRoutes } from '@pages/my-account/my-account.routes';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store';
import { defined } from '@shared/helpers/testing/defined';

describe('myAccountRoutes', () => {
	function routeOf(path: string): Route {
		return defined(myAccountRoutes.find((route) => route.path === path));
	}

	it('serves the account and invitations pages', () => {
		// Arrange
		const expected: unknown[] = [MyAccountPage, InvitationsListPage];

		// Act
		const components: unknown[] = myAccountRoutes.map((route): unknown => route.component);

		// Assert
		expect(components).toEqual(expected);
	});

	it('exposes the paths used by the account routes of the registry', () => {
		// Arrange
		const paths: string[] = [RegistryRouteEnum.MY_ACCOUNT_INVITATIONS];

		// Act
		const relative = paths.map((path: string) => path.replace(`${RegistryRouteEnum.MY_ACCOUNT}/`, ''));

		// Assert
		expect(relative.every((path): boolean => !!routeOf(path))).toBe(true);
	});

	it('provides the project profile facade and store to the invitations page', () => {
		// Arrange
		const invitations = routeOf('invitations');

		// Act
		const providers: unknown[] = invitations.providers ?? [];

		// Assert
		expect(providers).toEqual([ProjectProfileFacade, ProjectProfileStore]);
	});
});
