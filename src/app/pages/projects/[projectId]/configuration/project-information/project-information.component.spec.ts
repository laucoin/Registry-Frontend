import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectInformationComponent } from '@pages/projects/[projectId]/configuration/project-information/project-information.component';
import { ProjectInformationHarness } from '@pages/projects/[projectId]/configuration/project-information/testing/project-information.harness';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

const PROJECT = {
	id: 'p1',
	name: 'Camp',
	visible: true,
	begin: { date: '2026-07-01', time: undefined },
	end: { date: '2026-07-20', time: undefined },
	status: { value: 'IN_PROGRESS', label: 'En cours' },
	options: [
		{ value: ProjectOptionEnum.VEHICLE, label: 'Véhicules' },
		{ value: ProjectOptionEnum.ALERT, label: 'Alertes' },
	],
} as unknown as ProjectModel;

const userWith = (...authorities: ProjectAuthorityEnum[]): CurrentUserModel =>
	({ authorities: authorities.map((authority) => `p1_${authority}`) }) as unknown as CurrentUserModel;

describe('ProjectInformationComponent', () => {
	let selectedProject: WritableSignal<ProjectModel | undefined>;
	let currentUser: WritableSignal<CurrentUserModel | undefined>;

	async function create(): Promise<ProjectInformationHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectInformationComponent),
			ProjectInformationHarness,
		);
	}

	beforeEach(() => {
		selectedProject = signal(PROJECT);
		currentUser = signal(userWith());
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{ provide: DatePipe, useValue: { transform: (value: string): string => value } },
				{
					provide: SessionFacade,
					useValue: { selectedProject, currentUser, currentProjectId: (): string => 'p1' },
				},
			],
		});
	});

	it.each([
		{
			name: 'its name, period, status and options',
			project: PROJECT,
			expected: {
				name: 'Camp',
				period: 'fr.projectInformation.periodValue · fr.projectInformation.status',
				options: 'Véhicules · Alertes',
				ratio: '2/4',
			},
		},
		{
			name: 'only the labelled options',
			project: {
				...PROJECT,
				options: [{ value: ProjectOptionEnum.VEHICLE, label: 'Véhicules' }, { value: ProjectOptionEnum.ALERT }],
			} as unknown as ProjectModel,
			expected: {
				name: 'Camp',
				period: 'fr.projectInformation.periodValue · fr.projectInformation.status',
				options: 'Véhicules',
				ratio: '2/4',
			},
		},
		{
			name: 'that it has neither status nor options',
			project: { ...PROJECT, status: undefined, options: undefined } as unknown as ProjectModel,
			expected: {
				name: 'Camp',
				period: 'fr.projectInformation.periodValue',
				options: 'fr.projectInformation.noOptions',
				ratio: '0/4',
			},
		},
	])('shows $name', async ({ project, expected }) => {
		// Arrange
		selectedProject.set(project);
		const harness = await create();

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual({ ...expected, editLink: undefined });
	});

	it.each([
		{
			name: 'links to the edition of the project for a user who may update it',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_U,
			link: '/projects/p1/edit',
		},
		{
			name: 'offers no edition to a user who may only update its profiles',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
			link: undefined,
		},
	])('$name', async ({ authority, link }) => {
		// Arrange
		currentUser.set(userWith(authority));
		const harness = await create();

		// Act
		const view = await harness.view();

		// Assert
		expect(view.editLink).toBe(link);
	});

	it('shows nothing without a selected project', async () => {
		// Arrange
		selectedProject.set(undefined);
		const harness = await create();

		// Act
		const shown = await harness.shown();

		// Assert
		expect(shown).toBe(false);
	});
});
