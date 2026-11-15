import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ActivityStatisticsComponent } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-statistics/activity-statistics.component';
import {
	ActivityStatisticEnum,
	ActivityStatisticsHarness,
} from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-statistics/testing/activity-statistics.harness';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { defined } from '@shared/helpers/testing/defined';
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model';
import { NotificationModel } from '@shared/models/model/notification.model';

const STATISTICS: ActivityStatisticsModel = {
	participantCount: 3,
	projectParticipantCount: 12,
	participantRate: 0.25,
	movementSeconds: 8100,
	manSeconds: 2203200,
};

@Component({
	imports: [ActivityStatisticsComponent],
	templateUrl: './activity-statistics.component.spec.html',
})
class HostComponent {
	public retries = 0;
}

describe('ActivityStatisticsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let statistics: WritableSignal<ActivityStatisticsModel | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;

	async function create(): Promise<ActivityStatisticsHarness> {
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ActivityStatisticsHarness);
	}

	beforeEach(() => {
		statistics = signal<ActivityStatisticsModel | undefined>(STATISTICS);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							activities: {
								statistics: {
									participation: { hint: '{{ count }} of {{ total }}', empty: 'No participant' },
									movement: { hint: 'Out' },
									man: { hint: 'Man' },
								},
							},
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: ActivityFacade,
					useValue: {
						activityStatistics: statistics,
						activityStatisticsLoading: loading,
						activityStatisticsError: error,
					},
				},
			],
		});
	});

	it.each([
		{
			name: 'the participation as a percentage of the project participants',
			value: STATISTICS,
			statistic: ActivityStatisticEnum.PARTICIPATION,
			expected: { hint: '3 of 12', loading: false, value: 0.25 },
		},
		{
			name: 'a participation of zero as a value and not as missing data',
			value: { ...STATISTICS, participantCount: 0, participantRate: 0 },
			statistic: ActivityStatisticEnum.PARTICIPATION,
			expected: { hint: '0 of 12', loading: false, value: 0 },
		},
		{
			name: 'why there is no participation when the project has no participant',
			value: { ...STATISTICS, projectParticipantCount: 0, participantRate: undefined },
			statistic: ActivityStatisticEnum.PARTICIPATION,
			expected: { hint: 'No participant', loading: false, value: undefined },
		},
		{
			name: 'the time out in hours',
			value: STATISTICS,
			statistic: ActivityStatisticEnum.MOVEMENT,
			expected: { hint: 'Out', loading: false, value: 'PT2H15M' },
		},
		{
			name: 'the man time in hours and not in days',
			value: STATISTICS,
			statistic: ActivityStatisticEnum.MAN,
			expected: { hint: 'Man', loading: false, value: 'PT612H' },
		},
	])('shows $name', async ({ value, statistic, expected }) => {
		// Arrange
		statistics.set(value);
		const harness = await create();

		// Act
		const shown = await harness.statistic(statistic);

		// Assert
		expect(shown).toEqual(expected);
	});

	it.each([ActivityStatisticEnum.PARTICIPATION, ActivityStatisticEnum.MOVEMENT, ActivityStatisticEnum.MAN])(
		'shows the %s as loading with no hint before it is known',
		async (name) => {
			// Arrange
			statistics.set(undefined);
			loading.set(true);
			const harness = await create();

			// Act
			const shown = await harness.statistic(name);

			// Assert
			expect(shown).toEqual({ hint: '', loading: true, value: undefined });
		},
	);

	it('replaces the statistics with the failure and asks for a retry', async () => {
		// Arrange
		error.set({ summary: 'Unavailable', detail: 'Try later' });
		const harness = await create();

		// Act
		await defined(await harness.error()).retry();

		// Assert
		expect([await harness.shown(), fixture.componentInstance.retries]).toEqual([false, 1]);
	});
});
