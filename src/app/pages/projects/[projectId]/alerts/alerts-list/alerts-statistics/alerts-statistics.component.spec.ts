import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { AlertsStatisticsComponent } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-statistics/alerts-statistics.component';
import {
	AlertsStatisticEnum,
	AlertsStatisticsHarness,
} from '@pages/projects/[projectId]/alerts/alerts-list/alerts-statistics/testing/alerts-statistics.harness';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model';
import { NotificationModel } from '@shared/models/model/notification.model';

const STATISTICS: AlertStatisticsModel = {
	resolvedCount: 13,
	canceledCount: 2,
	averageResolutionSeconds: 8100,
	realAlertRate: 13 / 15,
};

const NOTHING_CLOSED: AlertStatisticsModel = {
	resolvedCount: 0,
	canceledCount: 0,
	averageResolutionSeconds: undefined,
	realAlertRate: undefined,
};

describe('AlertsStatisticsComponent', () => {
	let statistics: WritableSignal<AlertStatisticsModel | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetchAlertStatistics: Mock<() => void>;

	async function create(): Promise<AlertsStatisticsHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(AlertsStatisticsComponent),
			AlertsStatisticsHarness,
		);
	}

	beforeEach(() => {
		statistics = signal<AlertStatisticsModel | undefined>(STATISTICS);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		fetchAlertStatistics = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							alerts: {
								statistics: {
									resolution: { hint: 'Average', empty: 'Nothing resolved' },
									rate: { hint: '{{ resolved }} of {{ closed }}', empty: 'Nothing closed' },
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
					provide: AlertFacade,
					useValue: {
						alertStatistics: statistics,
						alertStatisticsLoading: loading,
						alertStatisticsError: error,
						fetchAlertStatistics,
					},
				},
			],
		});
	});

	it('loads the statistics once displayed', async () => {
		// Arrange
		// Act
		await create();

		// Assert
		expect(fetchAlertStatistics).toHaveBeenCalledTimes(1);
	});

	it.each([
		{
			name: 'the average resolution time as an ISO duration',
			value: STATISTICS,
			statistic: AlertsStatisticEnum.RESOLUTION,
			expected: { hint: 'Average', loading: false, value: 'PT2H15M' },
		},
		{
			name: 'the real alert rate explained by the closed alerts',
			value: STATISTICS,
			statistic: AlertsStatisticEnum.RATE,
			expected: { hint: '13 of 15', loading: false, value: 13 / 15 },
		},
		{
			name: 'a rate of zero as a value and not as missing data',
			value: { ...NOTHING_CLOSED, canceledCount: 4, realAlertRate: 0 },
			statistic: AlertsStatisticEnum.RATE,
			expected: { hint: '0 of 4', loading: false, value: 0 },
		},
		{
			name: 'no resolution time while nothing is resolved',
			value: NOTHING_CLOSED,
			statistic: AlertsStatisticEnum.RESOLUTION,
			expected: { hint: 'Nothing resolved', loading: false, value: undefined },
		},
		{
			name: 'no rate while nothing is closed',
			value: NOTHING_CLOSED,
			statistic: AlertsStatisticEnum.RATE,
			expected: { hint: 'Nothing closed', loading: false, value: undefined },
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

	it.each([AlertsStatisticEnum.RESOLUTION, AlertsStatisticEnum.RATE])(
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

	it('replaces the statistics with the failure and loads them again on retry', async () => {
		// Arrange
		error.set({ summary: 'Unavailable', detail: 'Try later' });
		const harness = await create();

		// Act
		await (await harness.error())?.retry();

		// Assert
		expect([await harness.shown(), fetchAlertStatistics.mock.calls.length]).toEqual([false, 2]);
	});
});
