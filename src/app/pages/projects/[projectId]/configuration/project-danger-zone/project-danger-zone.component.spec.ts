import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectDangerZoneComponent } from '@pages/projects/[projectId]/configuration/project-danger-zone/project-danger-zone.component';
import { ProjectDangerZoneHarness } from '@pages/projects/[projectId]/configuration/project-danger-zone/testing/project-danger-zone.harness';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectDangerCommandEnum } from '@shared/models/enumeration/project-danger-command.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

const PROJECT = { id: 'p1', name: 'Camp', visible: true } as ProjectModel;
const ALL = [
	ProjectAuthorityEnum.REGISTRY_PROJECT_SOFT_DELETE,
	ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE,
	ProjectAuthorityEnum.REGISTRY_PROJECT_D,
];

const userWith = (...authorities: ProjectAuthorityEnum[]): CurrentUserModel =>
	({ authorities: authorities.map((authority) => `p1_${authority}`) }) as unknown as CurrentUserModel;

describe('ProjectDangerZoneComponent', () => {
	let selectedProject: WritableSignal<ProjectModel | undefined>;
	let currentUser: WritableSignal<CurrentUserModel | undefined>;
	let confirm: Mock;
	let projectFacade: Record<string, Mock>;

	async function create(): Promise<ProjectDangerZoneHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectDangerZoneComponent),
			ProjectDangerZoneHarness,
		);
	}

	beforeEach(() => {
		selectedProject = signal(PROJECT);
		currentUser = signal(userWith(...ALL));
		confirm = vi.fn();
		projectFacade = { softDeleteProject: vi.fn(), restoreProject: vi.fn(), hardDeleteProject: vi.fn() };
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ProjectFacade, useValue: projectFacade },
				{ provide: ElementConfirmationService, useValue: { confirm } },
				{
					provide: SessionFacade,
					useValue: { selectedProject, currentUser, currentProjectId: (): string => 'p1' },
				},
			],
		});
	});

	it.each([
		{
			name: 'the disabling and the deletion of a visible project',
			project: PROJECT,
			expected: [
				{ id: 'softDelete', variant: 'warning', buttonVariant: 'warning' },
				{ id: 'hardDelete', variant: 'danger', buttonVariant: 'danger' },
			],
		},
		{
			name: 'the restoration and the deletion of a hidden project',
			project: { ...PROJECT, visible: false },
			expected: [
				{ id: 'restore', variant: 'info', buttonVariant: 'neutral' },
				{ id: 'hardDelete', variant: 'danger', buttonVariant: 'danger' },
			],
		},
	])('offers $name', async ({ project, expected }) => {
		// Arrange
		selectedProject.set(project);
		const harness = await create();

		// Act
		const commands = await harness.commands();

		// Assert
		expect(commands).toEqual(
			expected.map((command) => ({
				...command,
				title: `fr.projectConfiguration.dangerZone.${command.id}.title`,
			})),
		);
	});

	it.each([
		{ name: 'without any of their authorities', project: PROJECT, authorities: [] },
		{
			name: 'to a user who may only restore a visible project',
			project: PROJECT,
			authorities: [ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE],
		},
		{
			name: 'to a user who may only disable a hidden project',
			project: { ...PROJECT, visible: false },
			authorities: [ProjectAuthorityEnum.REGISTRY_PROJECT_SOFT_DELETE],
		},
		{ name: 'without a selected project', project: undefined, authorities: ALL },
	])('shows no zone $name', async ({ project, authorities }) => {
		// Arrange
		selectedProject.set(project);
		currentUser.set(userWith(...authorities));
		const harness = await create();

		// Act
		const shown = await harness.shown();

		// Assert
		expect(shown).toBe(false);
	});

	it.each([
		{
			name: 'disables the project',
			project: PROJECT,
			command: ProjectDangerCommandEnum.SOFT_DELETE,
			severity: SeverityEnum.WARNING,
			typed: false,
			action: 'softDeleteProject',
			argument: 'p1',
		},
		{
			name: 'restores the project',
			project: { ...PROJECT, visible: false },
			command: ProjectDangerCommandEnum.RESTORE,
			severity: SeverityEnum.INFO,
			typed: false,
			action: 'restoreProject',
			argument: 'p1',
		},
		{
			name: 'deletes the project after its name is typed',
			project: PROJECT,
			command: ProjectDangerCommandEnum.HARD_DELETE,
			severity: SeverityEnum.DANGER,
			typed: true,
			action: 'hardDeleteProject',
			argument: PROJECT,
		},
	])('$name once confirmed', async ({ project, command, severity, typed, action, argument }) => {
		// Arrange
		selectedProject.set(project);
		const harness = await create();
		await harness.run(command);

		// Act
		confirm.mock.calls[0][3]();

		// Assert
		expect([confirm.mock.calls[0].slice(0, 3), confirm.mock.calls[0][4], projectFacade[action].mock.calls]).toEqual(
			[[`projects.actions.confirmations.${command}`, project, severity], typed, [[argument]]],
		);
	});

	it('truncates a long project name in the confirmation', async () => {
		// Arrange
		selectedProject.set({ ...PROJECT, name: 'x'.repeat(60) });
		const harness = await create();

		// Act
		await harness.run(ProjectDangerCommandEnum.HARD_DELETE);

		// Assert
		expect(confirm.mock.calls[0][1].name).toBe(`${'x'.repeat(50)}…`);
	});
});
