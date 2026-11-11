import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ConfigurationPage } from '@pages/projects/[projectId]/configuration/configuration.page';
import { ConfigurationHarness } from '@pages/projects/[projectId]/configuration/testing/configuration.harness';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

const COUNTS = {
	participants: 15,
	groups: 7,
	acceptedProfiles: 6,
	vehicles: undefined,
	activities: 3,
	activeAlerts: 0,
};

const userWith = (...authorities: ProjectAuthorityEnum[]): CurrentUserModel =>
	({ authorities: authorities.map((authority) => `p1_${authority}`) }) as unknown as CurrentUserModel;
const projectWith = (options: ProjectOptionEnum[]): ProjectModel =>
	({
		id: 'p1',
		name: 'Camp',
		visible: true,
		options: options.map((value) => ({ value, label: value })),
		counts: COUNTS,
	}) as unknown as ProjectModel;

describe('ConfigurationPage', () => {
	let currentUser: WritableSignal<CurrentUserModel | undefined>;
	let selectedProject: WritableSignal<ProjectModel | undefined>;
	let fixture: ComponentFixture<ConfigurationPage>;

	async function create(): Promise<ConfigurationHarness> {
		fixture = TestBed.createComponent(ConfigurationPage);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ConfigurationHarness);
	}

	async function renderInformation(state: DeferBlockState): Promise<void> {
		await (await fixture.getDeferBlocks())[0].render(state);
	}

	beforeEach(() => {
		currentUser = signal(undefined);
		selectedProject = signal(projectWith([]));
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{ provide: DatePipe, useValue: { transform: (): string => '' } },
				{ provide: ProjectFacade, useValue: {} },
				{ provide: ElementConfirmationService, useValue: {} },
				{
					provide: SessionFacade,
					useValue: { currentUser, selectedProject, currentProjectId: (): string => 'p1' },
				},
			],
			deferBlockBehavior: DeferBlockBehavior.Manual,
		});
	});

	it('links a tile to each space the user may open, with its count', async () => {
		// Arrange
		currentUser.set(
			userWith(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R, ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_R),
		);
		const harness = await create();

		// Act
		const tiles = await harness.tiles();

		// Assert
		expect(tiles).toEqual([
			{
				key: 'groups',
				title: 'fr.projectConfiguration.tiles.groups.title',
				count: '7',
				link: '/projects/p1/configuration/groups',
			},
			{
				key: 'profiles',
				title: 'fr.projectConfiguration.tiles.profiles.title',
				count: '6',
				link: '/projects/p1/configuration/profiles',
			},
		]);
	});

	it('hides the tiles of the options the project does not have, and a count it does not know', async () => {
		// Arrange
		currentUser.set(
			userWith(ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_R, ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_R),
		);
		selectedProject.set(projectWith([ProjectOptionEnum.VEHICLE]));
		const harness = await create();

		// Act
		const tiles = await harness.tiles();

		// Assert
		expect(tiles.map((tile) => [tile.key, tile.count])).toEqual([['vehicles', undefined]]);
	});

	it('shows the project information once its block is loaded', async () => {
		// Arrange
		const harness = await create();

		// Act
		await renderInformation(DeferBlockState.Complete);

		// Assert
		expect(await (await harness.information())?.shown()).toBe(true);
	});

	it.each([
		{ name: 'reserves the place of the information before it is loaded', state: DeferBlockState.Placeholder },
		{ name: 'keeps the place of the information while it is loading', state: DeferBlockState.Loading },
	])('$name', async ({ state }) => {
		// Arrange
		const harness = await create();

		// Act
		await renderInformation(state);

		// Assert
		expect([await harness.information(), await harness.informationErrorTitle()]).toEqual([null, undefined]);
	});

	it('tells that the information failed to load', async () => {
		// Arrange
		const harness = await create();

		// Act
		await renderInformation(DeferBlockState.Error);

		// Assert
		expect(await harness.informationErrorTitle()).toBe('fr.global.notifications.UNKNOWN_ERROR.title');
	});
});
