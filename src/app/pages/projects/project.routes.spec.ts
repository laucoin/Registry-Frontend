import { Route } from '@angular/router';

import { describe, expect, it } from 'vitest';

import { vehicleOptionGuard } from '@core/authentication/guard/project-option.guard';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfileStore } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.store';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectStore } from '@pages/projects/data/state/project/project.store';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { projectRoutes } from '@pages/projects/project.routes';
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum';
import { defined } from '@shared/helpers/testing/defined';

describe('projectRoutes', () => {
	it('provides the project facade and store to every page below the projects area', () => {
		// Arrange
		const root = projectRoutes[0];

		// Act
		const providers: unknown[] = root.providers ?? [];

		// Assert
		expect(providers).toEqual([ProjectFacade, ProjectStore]);
		expect(root.path).toBe('');
	});

	it.each([[ProjectRoutesEnum.CREATE], [`${ProjectRoutesEnum.PROJECT_ID}/${ProjectRoutesEnum.EDIT}`]])(
		'provides the project profile facade and store to the project form of %s',
		(path) => {
			// Arrange
			const route = defined(defined(projectRoutes[0].children).find((child) => child.path === path));

			// Act
			const providers: unknown[] = route.providers ?? [];

			// Assert
			expect(providers).toEqual([ProjectProfileFacade, ProjectProfileStore]);
		},
	);

	function projectRoute(path: string): Route {
		const project = defined(
			defined(projectRoutes[0].children).find((route) => route.path === ProjectRoutesEnum.PROJECT_ID),
		);
		return defined(defined(project.children).find((route) => route.path === path));
	}

	it('serves the participants page with the facades of its tabs and of its counters', () => {
		// Arrange
		const route = projectRoute(ProjectRoutesEnum.PARTICIPANTS);

		// Act
		const providers: unknown[] = route.providers ?? [];

		// Assert
		expect(providers).toEqual(
			expect.arrayContaining([SelectedProjectFacade, ParticipantFacade, GroupStatusFacade]),
		);
	});

	it('serves the vehicles page only to projects having the vehicle option', () => {
		// Arrange
		const route = projectRoute(ProjectRoutesEnum.VEHICLES);

		// Act
		const guards: unknown[] = route.canActivate ?? [];

		// Assert
		expect(guards).toEqual([vehicleOptionGuard]);
		expect(route.providers).toEqual(expect.arrayContaining([SelectedProjectFacade, VehicleFacade]));
	});
});
