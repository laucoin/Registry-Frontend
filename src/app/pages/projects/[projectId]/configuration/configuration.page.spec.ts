import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ConfigurationPage } from '@pages/projects/[projectId]/configuration/configuration.page';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

interface ConfigurationPageInternals {
	tiles: () => { key: string; url: string }[];
	countOf: (tile: { count: string }) => number | undefined;
}

describe('ConfigurationPage', () => {
	let currentUser: WritableSignal<CurrentUserModel | undefined>;
	let selectedProject: WritableSignal<ProjectModel | undefined>;

	const userWith = (...authorities: string[]): CurrentUserModel => ({ authorities }) as unknown as CurrentUserModel;
	const projectWith = (options: ProjectOptionEnum[], counts?: ProjectModel['counts']): ProjectModel =>
		({
			id: 'p1',
			name: 'Camp',
			options: options.map((value) => ({ value, label: value })),
			counts,
		}) as unknown as ProjectModel;
	const create = (): ConfigurationPageInternals =>
		TestBed.createComponent(ConfigurationPage).componentInstance as unknown as ConfigurationPageInternals;

	beforeEach(() => {
		currentUser = signal(undefined);
		selectedProject = signal(undefined);
		TestBed.configureTestingModule({
			imports: [
				ConfigurationPage,
				TranslocoTestingModule.forRoot({ langs: {}, translocoConfig: { defaultLang: 'fr' } }),
			],
			providers: [
				provideRouter([]),
				DatePipe,
				{ provide: ProjectFacade, useValue: {} },
				{ provide: ElementConfirmationService, useValue: {} },
				{
					provide: SessionFacade,
					useValue: { currentUser, selectedProject, currentProjectId: signal('p1') },
				},
			],
		});
	});

	it('should list only the tiles the user is allowed to open', () => {
		// Arrange
		currentUser.set(
			userWith(
				`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R}`,
				`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_R}`,
			),
		);
		selectedProject.set(projectWith([]));

		// Act
		const keys = create()
			.tiles()
			.map((tile: { key: string }) => tile.key);

		// Assert
		expect(keys).toEqual(['participants', 'groups']);
	});

	it('should hide the tiles of the options the project does not have', () => {
		// Arrange
		currentUser.set(
			userWith(
				`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_R}`,
				`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_R}`,
			),
		);
		selectedProject.set(projectWith([ProjectOptionEnum.VEHICLE]));

		// Act
		const keys = create()
			.tiles()
			.map((tile: { key: string }) => tile.key);

		// Assert
		expect(keys).toEqual(['vehicles']);
	});

	it('should read the count of a tile from the project counts', () => {
		// Arrange
		selectedProject.set(
			projectWith([], {
				participants: 15,
				groups: 7,
				acceptedProfiles: 6,
				vehicles: undefined,
				activities: undefined,
				activeAlerts: undefined,
			}),
		);
		const page = create();

		// Act
		const profiles = page.countOf({ count: 'acceptedProfiles' });
		const vehicles = page.countOf({ count: 'vehicles' });

		// Assert
		expect(profiles).toBe(6);
		expect(vehicles).toBeUndefined();
	});

	it('should resolve the tile urls with the current project id', () => {
		// Arrange
		currentUser.set(userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R}`));
		selectedProject.set(projectWith([]));

		// Act
		const urls = create()
			.tiles()
			.map((tile: { url: string }) => tile.url);

		// Assert
		expect(urls).toEqual(['/projects/p1/configuration/groups']);
	});
});
