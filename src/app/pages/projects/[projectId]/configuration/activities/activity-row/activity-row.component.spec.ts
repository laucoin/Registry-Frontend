import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ActivityRowComponent } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-row.component';
import { ActivityRowHarness } from '@pages/projects/[projectId]/configuration/activities/activity-row/testing/activity-row.harness';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { defined } from '@shared/helpers/testing/defined';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ActivityModel } from '@shared/models/model/activity.model';

const ACTIVITY = {
	id: 'a1',
	name: 'Grand jeu',
	visible: true,
	duration: { label: '2 h' },
	allowedParticipants: { lower: 4, upper: 12 },
	startAvailability: { date: '2026-07-01', time: undefined },
	endAvailability: undefined,
	status: { value: AvailabilityStatusEnum.AVAILABLE, label: 'Available' },
} as unknown as ActivityModel;

const BARE = { id: 'a2', name: 'Veillée', visible: true } as unknown as ActivityModel;

@Component({
	imports: [ActivityRowComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './activity-row.component.spec.html',
})
class HostComponent {
	public readonly activity: WritableSignal<ActivityModel> = signal(ACTIVITY);
}

describe('ActivityRowComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let authorities: WritableSignal<string[]>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	async function create(activity: ActivityModel): Promise<ActivityRowHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.activity.set(activity);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ActivityRowHarness);
	}

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_ACTIVITY_HISTORY_R']);
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ActivityFacade, useValue: {} },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ authorities: authorities() }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm: vi.fn(), tinyScreen: signal(false) } },
				{ provide: Router, useValue: { navigateByUrl, url: '/list' } },
				{ provide: DatePipe, useValue: { transform: (): string => '01/07' } },
			],
		});
	});

	it.each([
		{
			name: 'titles an activity and describes its duration, allowed participants and availability',
			activity: ACTIVITY,
			expected: { title: 'Grand jeu', initials: 'GJ', description: '2 h 4-12 01/07...', tags: ['Available'] },
		},
		{
			name: 'leaves out what an activity does not have',
			activity: BARE,
			expected: { title: 'Veillée', initials: 'VE', description: '', tags: [] },
		},
	])('$name', async ({ activity, expected }) => {
		// Arrange
		const harness = await create(activity);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual({ ...expected, disabled: false });
	});

	it('greys out a hidden activity and labels it as hidden', async () => {
		// Arrange
		const harness = await create({ ...BARE, visible: false });

		// Act
		const view = await harness.view();

		// Assert
		expect([view.disabled, view.tags]).toEqual([true, ['fr.activities.visible.false']]);
	});

	it.each([
		{ name: 'an available activity in success', status: AvailabilityStatusEnum.AVAILABLE, variant: 'success' },
		{ name: 'another status as information', status: 'UNAVAILABLE', variant: 'info' },
	])('colours $name', async ({ status, variant }) => {
		// Arrange
		const harness = await create({ ...ACTIVITY, status: { value: status, label: status } } as ActivityModel);

		// Act
		const shown = await harness.statusVariant();

		// Assert
		expect(shown).toBe(variant);
	});

	it('opens the movements history from the primary action when it is allowed', async () => {
		// Arrange
		const harness = await create(ACTIVITY);

		// Act
		await defined(await harness.primary()).click();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('a1'));
	});

	it('shows the primary action as unavailable to a user who cannot read the history, and does not run it', async () => {
		// Arrange
		authorities.set([]);
		const harness = await create(ACTIVITY);
		const primary = defined(await harness.primary());

		// Act
		await primary.click();

		// Assert
		expect([await primary.disabled(), navigateByUrl.mock.calls.length]).toEqual([true, 0]);
	});
});
