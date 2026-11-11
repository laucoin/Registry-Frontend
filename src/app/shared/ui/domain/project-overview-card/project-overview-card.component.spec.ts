import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProjectOverviewCardComponent } from '@shared/ui/domain/project-overview-card/project-overview-card.component';
import { ProjectOverviewCardHarness } from '@shared/ui/domain/project-overview-card/testing/project-overview-card.harness';

@Component({ template: '' })
class EmptyComponent {}

describe('ProjectOverviewCardComponent', () => {
	async function create(inputs: Record<string, unknown> = {}): Promise<ProjectOverviewCardHarness> {
		const fixture = TestBed.createComponent(ProjectOverviewCardComponent);
		Object.entries({
			translationPrefix: 'overview',
			icon: 'car',
			stats: [
				{ labelKey: 'present', value: 3 },
				{ labelKey: 'out', value: undefined },
			],
			link: '/projects/p1/vehicles',
			...inputs,
		}).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectOverviewCardHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('names the card and each counter after the translation prefix, with a dash for an unknown value', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.title(), await harness.stats()];

		// Assert
		expect(shown).toEqual([
			'fr.overview.title',
			[
				{ label: 'fr.overview.present', value: '3' },
				{ label: 'fr.overview.out', value: '–' },
			],
		]);
	});

	it.each([
		{
			name: 'shows the total and the date of the last refresh once known',
			total: 3,
			lastRefresh: new Date(),
			expected: ['fr.overview.total', 'fr.global.date-and-time-format.last-refresh'],
		},
		{
			name: 'shows neither the total nor the date while unknown',
			total: undefined,
			lastRefresh: undefined,
			expected: [undefined, undefined],
		},
	])('$name', async ({ total, lastRefresh, expected }) => {
		// Arrange
		const inputs = { total, lastRefresh };

		// Act
		const harness = await create(inputs);

		// Assert
		expect([await harness.totalText(), await harness.lastRefreshText()]).toEqual(expected);
	});

	it('leads to the detail page', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.followLink();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/projects/p1/vehicles');
	});

	it('hides the link when asked to', async () => {
		// Arrange
		const inputs = { showLink: false };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.hasLink()).toBe(false);
	});
});
