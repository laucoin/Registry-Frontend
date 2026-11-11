import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import {
	VehicleStatisticEnum,
	VehicleStatisticsHarness,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-statistics/testing/vehicle-statistics.harness';
import { VehicleStatisticsComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-statistics/vehicle-statistics.component';
import { VehicleTimelineModel } from '@shared/models/model/vehicle-timeline.model';

const TIMELINE: VehicleTimelineModel = { planned: [], actual: [], outSeconds: 8100, usageRate: 0.25 };

describe('VehicleStatisticsComponent', () => {
	let timeline: WritableSignal<VehicleTimelineModel | undefined>;
	let loading: WritableSignal<boolean>;

	async function create(): Promise<VehicleStatisticsHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(VehicleStatisticsComponent),
			VehicleStatisticsHarness,
		);
	}

	beforeEach(() => {
		timeline = signal<VehicleTimelineModel | undefined>(TIMELINE);
		loading = signal(false);
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							vehicles: { statistics: { out: { hint: 'Out' }, usage: { hint: 'Used', empty: 'Never' } } },
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{ provide: VehicleFacade, useValue: { vehicleTimeline: timeline, vehicleTimelineLoading: loading } },
			],
		});
	});

	it.each([
		{
			name: 'the time out as an ISO duration',
			value: TIMELINE,
			statistic: VehicleStatisticEnum.OUT,
			expected: { hint: 'Out', loading: false, value: 'PT2H15M' },
		},
		{
			name: 'the usage rate as a percentage',
			value: TIMELINE,
			statistic: VehicleStatisticEnum.USAGE,
			expected: { hint: 'Used', loading: false, value: 0.25 },
		},
		{
			name: 'a usage rate of zero as a value and not as missing data',
			value: { ...TIMELINE, usageRate: 0 },
			statistic: VehicleStatisticEnum.USAGE,
			expected: { hint: 'Used', loading: false, value: 0 },
		},
		{
			name: 'why there is no usage rate',
			value: { ...TIMELINE, usageRate: undefined },
			statistic: VehicleStatisticEnum.USAGE,
			expected: { hint: 'Never', loading: false, value: undefined },
		},
	])('shows $name', async ({ value, statistic, expected }) => {
		// Arrange
		timeline.set(value);
		const harness = await create();

		// Act
		const shown = await harness.statistic(statistic);

		// Assert
		expect(shown).toEqual(expected);
	});

	it.each([VehicleStatisticEnum.OUT, VehicleStatisticEnum.USAGE])(
		'shows the %s as loading with no hint before it is known',
		async (name) => {
			// Arrange
			timeline.set(undefined);
			loading.set(true);
			const harness = await create();

			// Act
			const shown = await harness.statistic(name);

			// Assert
			expect(shown).toEqual({ hint: '', loading: true, value: undefined });
		},
	);
});
