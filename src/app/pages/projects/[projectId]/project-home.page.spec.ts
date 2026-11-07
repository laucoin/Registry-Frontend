import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

import { ProjectHomePage } from './project-home.page';

const PROJECT_ID = 'p1';

function userWith(...authorities: string[]): CurrentUserModel {
	return { authorities } as unknown as CurrentUserModel;
}

describe('ProjectHomePage', () => {
	let currentUser: WritableSignal<CurrentUserModel | undefined>;
	let projectId: WritableSignal<string | undefined>;
	let selectedProject: WritableSignal<ProjectModel | undefined>;
	let toggleSelectedProjectFavorite: ReturnType<typeof vi.fn>;
	let page: ProjectHomePage;

	beforeEach(() => {
		currentUser = signal<CurrentUserModel | undefined>(undefined);
		projectId = signal<string | undefined>(PROJECT_ID);
		selectedProject = signal<ProjectModel | undefined>(undefined);
		toggleSelectedProjectFavorite = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				{
					provide: SessionFacade,
					useValue: {
						selectedProject,
						toggleSelectedProjectFavorite,
						selectedProjectHasOption: (): WritableSignal<boolean> => signal(true),
						currentUser,
						currentProjectId: projectId,
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
			],
		});
		page = TestBed.runInInjectionContext(() => new ProjectHomePage());
	});

	it('lets who can create movements see the arrivals and the departures of the day', () => {
		// Arrange
		currentUser.set(userWith(`${PROJECT_ID}_REGISTRY_PROJECT_MOVEMENT_C`));

		// Act
		const allowed = page['canSeePlannedMovements']();

		// Assert
		expect(allowed).toBe(true);
	});

	it('hides the arrivals and the departures from who cannot create movements', () => {
		// Arrange
		currentUser.set(userWith(`${PROJECT_ID}_REGISTRY_PROJECT_MOVEMENT_R`));

		// Act
		const allowed = page['canSeePlannedMovements']();

		// Assert
		expect(allowed).toBe(false);
	});

	it('lets who can create alerts open the alert creation', () => {
		// Arrange
		currentUser.set(userWith(`${PROJECT_ID}_REGISTRY_PROJECT_ALERT_C`));

		// Act
		const allowed = page['canCreateAlert']();

		// Assert
		expect(allowed).toBe(true);
	});

	it('hides the alert creation from who cannot create alerts', () => {
		// Arrange
		currentUser.set(userWith(`${PROJECT_ID}_REGISTRY_PROJECT_ALERT_R`));

		// Act
		const allowed = page['canCreateAlert']();

		// Assert
		expect(allowed).toBe(false);
	});

	it('targets the movement creation of the selected project', () => {
		// Arrange

		// Act
		const route = page['registeredMovementRoute']();

		// Assert
		expect(route).toBe(`/projects/${PROJECT_ID}/movements/create/registered`);
	});

	it('does not take the right of another project into account', () => {
		// Arrange
		currentUser.set(userWith('other_REGISTRY_PROJECT_MOVEMENT_C'));

		// Act
		const allowed = page['canSeePlannedMovements']();

		// Assert
		expect(allowed).toBe(false);
	});

	it('hides them while the user or the project is not known', () => {
		// Arrange
		projectId.set(undefined);

		// Act
		const withoutProject = page['canSeePlannedMovements']();
		currentUser.set(undefined);
		projectId.set(PROJECT_ID);
		const withoutUser = page['canSeePlannedMovements']();

		// Assert
		expect([withoutProject, withoutUser]).toEqual([false, false]);
	});

	it('closes the alert drawer only when the drawer itself asks to hide', () => {
		// Arrange
		const target = new EventTarget();
		const own = Object.defineProperties(new Event('sgdf-hide'), {
			target: { value: target },
			currentTarget: { value: target },
		});
		const nested = Object.defineProperties(new Event('sgdf-hide'), {
			target: { value: target },
			currentTarget: { value: new EventTarget() },
		});
		page['creatingAlert'].set(true);

		// Act
		page['closeAlertDrawer'](nested);
		const afterNested = page['creatingAlert']();
		page['closeAlertDrawer'](own);

		// Assert
		expect(afterNested).toBe(true);
		expect(page['creatingAlert']()).toBe(false);
	});

	it('links the movement forms of the selected project', () => {
		// Arrange
		const expectedProject: string = PROJECT_ID;

		// Act
		const routes = [page['registeredMovementRoute'](), page['guestMovementRoute']()];

		// Assert
		expect(routes.every((route) => route.includes(expectedProject))).toBe(true);
	});

	it.each([
		['PROJECT_ADMINISTRATOR', true],
		['PROJECT_COORDINATOR', true],
		['PROJECT_PARTICIPANT', false],
	])('shows the birthdays and the regularizations to the role %s: %s', (role, expected) => {
		// Arrange
		selectedProject.set({ profile: { role: { value: role } } } as unknown as ProjectModel);

		// Act
		const visible = page['canSeeProfileWidgets']();

		// Assert
		expect(visible).toBe(expected);
	});

	it('hides the birthdays and the regularizations while the project has no profile', () => {
		// Arrange
		selectedProject.set({ id: PROJECT_ID } as unknown as ProjectModel);

		// Act
		const visible = page['canSeeProfileWidgets']();

		// Assert
		expect(visible).toBe(false);
	});

	it('toggles the favorite of the selected project through the session facade', () => {
		// Act
		page['toggleFavorite']();

		// Assert
		expect(toggleSelectedProjectFavorite).toHaveBeenCalledTimes(1);
	});
});
