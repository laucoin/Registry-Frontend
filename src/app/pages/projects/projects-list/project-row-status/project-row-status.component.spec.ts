import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ProjectActions } from '@pages/projects/projects-list/project-actions.service';
import { ProjectRowStatusComponent } from '@pages/projects/projects-list/project-row-status/project-row-status.component';
import {
	ProjectAccessEnum,
	ProjectRowStatusHarness,
} from '@pages/projects/projects-list/project-row-status/testing/project-row-status.harness';
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ProjectMapper } from '@shared/mappers/project.mapper';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { ProjectModel } from '@shared/models/model/project.model';

const VEHICLE = { label: 'Vehicle', value: ProjectOptionEnum.VEHICLE };
const ALERT = { label: 'Alert', value: ProjectOptionEnum.ALERT };

@Component({
	imports: [ProjectRowStatusComponent],
	template: `<app-project-row-status
		[project]="project()"
		(optionsRequested)="events.push('options')"
		(hiddenNoticeRequested)="events.push('hidden')"
	/>`,
})
class HostComponent {
	public readonly project = signal<ProjectModel>(ProjectMapper.toModel(PROJECT_DTO));
	public readonly events: string[] = [];
}

enum RowAccessEnum {
	JOIN = 'join',
	SUPPORT = 'support',
	NONE = 'none',
}

describe('ProjectRowStatusComponent', () => {
	let actions: { canJoin: Mock; canCreateSupport: Mock; join: Mock; confirmSupportProfile: Mock };
	let host: HostComponent;

	async function create(
		overrides: Partial<ProjectModel>,
		access: RowAccessEnum = RowAccessEnum.JOIN,
	): Promise<ProjectRowStatusHarness> {
		actions.canJoin.mockReturnValue(access === RowAccessEnum.JOIN);
		actions.canCreateSupport.mockReturnValue(access === RowAccessEnum.SUPPORT);
		const fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		host.project.update((project) => ({ ...project, ...overrides }));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectRowStatusHarness);
	}

	beforeEach(() => {
		actions = { canJoin: vi.fn(), canCreateSupport: vi.fn(), join: vi.fn(), confirmSupportProfile: vi.fn() };
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							projects: { options: { one: '{{ name }}', few: '{{ name }} +{{ others }}', zero: 'none' } },
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [{ provide: ProjectActions, useValue: actions }],
		});
	});

	it.each([
		{
			name: 'a visible available project with one option, open to join',
			overrides: { status: { label: 'Open', value: AvailabilityStatusEnum.AVAILABLE }, options: [VEHICLE] },
			access: RowAccessEnum.JOIN,
			expected: {
				hidden: false,
				status: { label: 'Open', variant: 'success' },
				options: 'Vehicle',
				access: ProjectAccessEnum.SELECT,
			},
		},
		{
			name: 'a hidden unavailable project with options, open to a support profile',
			overrides: {
				visible: false,
				status: { label: 'Closed', value: 'CLOSED' as never },
				options: [VEHICLE, ALERT],
			},
			access: RowAccessEnum.SUPPORT,
			expected: {
				hidden: true,
				status: { label: 'Closed', variant: 'info' },
				options: 'Vehicle +1 (projects.options-open)',
				access: ProjectAccessEnum.SUPPORT,
			},
		},
		{
			name: 'a project without status nor option, closed to the user',
			overrides: { status: undefined, options: undefined },
			access: RowAccessEnum.NONE,
			expected: { hidden: false, status: undefined, options: 'none', access: undefined },
		},
	])('shows $name', async ({ overrides, access, expected }) => {
		// Arrange
		const harness = await create(overrides as Partial<ProjectModel>, access);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual(expected);
	});

	it('asks the page to list the options of a project that has several', async () => {
		// Arrange
		const harness = await create({ options: [VEHICLE, ALERT] });

		// Act
		await harness.openOptions();

		// Assert
		expect(host.events).toEqual(['options']);
	});

	it.each([
		{
			name: 'joins a visible project',
			visible: true,
			access: RowAccessEnum.JOIN,
			joined: 1,
			supported: 0,
			events: [],
		},
		{
			name: 'asks for a support profile on a visible project',
			visible: true,
			access: RowAccessEnum.SUPPORT,
			joined: 0,
			supported: 1,
			events: [],
		},
		{
			name: 'only notices that a hidden project cannot be joined',
			visible: false,
			access: RowAccessEnum.JOIN,
			joined: 0,
			supported: 0,
			events: ['hidden'],
		},
		{
			name: 'only notices that a hidden project cannot get a support profile',
			visible: false,
			access: RowAccessEnum.SUPPORT,
			joined: 0,
			supported: 0,
			events: ['hidden'],
		},
	])('$name', async ({ visible, access, joined, supported, events }) => {
		// Arrange
		const harness = await create({ visible }, access);

		// Act
		if (access === RowAccessEnum.JOIN) await harness.select();
		else await harness.requestSupport();

		// Assert
		expect([actions.join.mock.calls.length, actions.confirmSupportProfile.mock.calls.length, host.events]).toEqual([
			joined,
			supported,
			events,
		]);
	});
});
