import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { defined } from '@shared/helpers/testing/defined';
import { OutingModel } from '@shared/models/model/outing.model';
import { PresenceTimelineComponent } from '@shared/ui/common/presence-timeline/presence-timeline.component';
import {
	PresenceTimelineHarness,
	TimelineKindEnum,
} from '@shared/ui/common/presence-timeline/testing/presence-timeline.harness';

const OUTING: OutingModel = { start: new Date(2026, 6, 4, 9, 0), end: new Date(2026, 6, 4, 12, 30), ongoing: false };
const PROJECT = {
	projectBegin: { date: '2026-07-01', time: undefined },
	projectEnd: { date: '2026-07-10', time: undefined },
};

describe('PresenceTimelineComponent', () => {
	let fixture: ComponentFixture<PresenceTimelineComponent>;

	async function create(inputs: Record<string, unknown>): Promise<PresenceTimelineHarness> {
		fixture = TestBed.createComponent(PresenceTimelineComponent);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, PresenceTimelineHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('draws the planned and the actual timelines on the axis of the project', async () => {
		// Arrange
		const inputs: Record<string, unknown> = {
			...PROJECT,
			planned: [{ start: { date: '2026-07-03', time: undefined }, end: undefined }],
			actual: [OUTING],
		};

		// Act
		const harness = await create(inputs);

		// Assert
		const planned = defined(await harness.timeline(TimelineKindEnum.PLANNED));
		const actual = defined(await harness.timeline(TimelineKindEnum.ACTUAL));
		expect([planned.start, planned.ranges[0].variant]).toEqual(['2026-07-01T00:00', 'info']);
		expect([actual.end, actual.ranges[0].variant]).toEqual(['2026-07-10T23:59', 'warning']);
	});

	it('says when nothing is planned or when there is no outing', async () => {
		// Arrange
		const inputs: Record<string, unknown> = { ...PROJECT };

		// Act
		const harness = await create(inputs);

		// Assert
		expect([
			await harness.emptyShown(TimelineKindEnum.PLANNED),
			await harness.emptyShown(TimelineKindEnum.ACTUAL),
		]).toEqual([true, true]);
	});

	it('labels an ongoing outing with its start in the active language', async () => {
		// Arrange
		const ongoing: OutingModel = { ...OUTING, ongoing: true };

		// Act
		const harness = await create({ ...PROJECT, actual: [ongoing] });

		// Assert
		const range = defined(await harness.timeline(TimelineKindEnum.ACTUAL)).ranges[0];
		expect(range.label).toBe('fr.timeline.ongoing');
		expect(range.variant).toBe('danger');
	});

	it('explains that there is no period when the project has no dates and nothing is known', async () => {
		// Arrange
		const inputs: Record<string, unknown> = {};

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.noPeriodShown()).toBe(true);
		expect(await harness.timeline(TimelineKindEnum.PLANNED)).toBeUndefined();
	});

	it('shows a busy placeholder instead of the timelines while loading', async () => {
		// Arrange
		const inputs: Record<string, unknown> = { ...PROJECT, loading: true };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.busy()).toBe('true');
		expect(await harness.timeline(TimelineKindEnum.PLANNED)).toBeUndefined();
	});

	it('shows the failure instead of the timelines and relays the retry', async () => {
		// Arrange
		const harness = await create({ error: { summary: 'Unavailable', detail: 'Try later' } });
		let retries = 0;
		fixture.componentInstance.retry.subscribe(() => retries++);

		// Act
		await defined(await harness.error()).retry();

		// Assert
		expect(await harness.timeline(TimelineKindEnum.PLANNED)).toBeUndefined();
		expect(retries).toBe(1);
	});
});
