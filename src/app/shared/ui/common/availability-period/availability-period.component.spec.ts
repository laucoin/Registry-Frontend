import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { AvailabilityPeriodComponent } from '@shared/ui/common/availability-period/availability-period.component';
import { AvailabilityPeriodHarness } from '@shared/ui/common/availability-period/testing/availability-period.harness';

const DAY: CustomDatetimeModel = { date: '2026-07-01', time: undefined };

describe('AvailabilityPeriodComponent', () => {
	async function create(start?: CustomDatetimeModel, end?: CustomDatetimeModel): Promise<AvailabilityPeriodHarness> {
		const fixture = TestBed.createComponent(AvailabilityPeriodComponent);
		fixture.componentRef.setInput('start', start);
		fixture.componentRef.setInput('end', end);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AvailabilityPeriodHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [{ provide: DatePipe, useValue: { transform: (): string => '01/07' } }],
		});
	});

	it.each([
		{ name: 'both bounds', start: DAY, end: DAY, expected: ['01/07', '01/07'] },
		{ name: 'an open start', start: undefined, end: DAY, expected: ['...', '01/07'] },
		{ name: 'an open end', start: DAY, end: undefined, expected: ['01/07', '...'] },
	])('shows a period with $name', async ({ start, end, expected }) => {
		// Arrange
		const harness = await create(start, end);

		// Act
		const bounds = await harness.bounds();

		// Assert
		expect(bounds).toEqual(expected);
	});
});
