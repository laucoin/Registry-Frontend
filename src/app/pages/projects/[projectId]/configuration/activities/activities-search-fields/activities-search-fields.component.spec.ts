import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { toActivitiesListSearchModel } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.search';
import { ActivitiesSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/activities/activities-search-fields/activities-search-fields.component';
import { ActivitiesSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/activities/activities-search-fields/testing/activities-search-fields.harness';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { createSearchForm } from '@shared/helpers/form/search.form';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [ActivitiesSearchFieldsComponent],
	templateUrl: './activities-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toActivitiesListSearchModel({
			q: undefined,
			at: undefined,
			isAvailable: undefined,
			isVisible: undefined,
			sort: undefined,
		}),
	);
	public readonly form = createSearchForm(this.model);
	public searches = 0;
}

describe('ActivitiesSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(authorities: string[]): Promise<ActivitiesSearchFieldsHarness> {
		TestBed.overrideProvider(SessionFacade, {
			useValue: { currentUser: signal({ authorities }), selectedProject: signal({ id: 'p1' }) },
		});
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ActivitiesSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: {} },
				{
					provide: ActivityFacade,
					useValue: { availabilitiesMetadata: signal(CHOICES), visibilitiesMetadata: signal(CHOICES) },
				},
			],
		});
	});

	it.each([
		{
			name: 'the visibility filter to a user who restores them',
			authorities: ['p1_REGISTRY_PROJECT_ACTIVITY_RESTORE'],
			filters: ['is-available', 'is-visible'],
		},
		{ name: 'no visibility filter to the others', authorities: [], filters: ['is-available'] },
	])('offers $name', async ({ authorities, filters }) => {
		// Arrange
		const harness = await create(authorities);

		// Act
		const shown = await harness.filters();

		// Assert
		expect(shown).toEqual(filters.map((filter) => `activities-search-fields-${filter}-select`));
	});

	it('binds the typed text and the chosen filters to the form, and signals the validated search', async () => {
		// Arrange
		const harness = await create(['p1_REGISTRY_PROJECT_ACTIVITY_RESTORE']);

		// Act
		await harness.search('camp');
		await harness.choose('is-available', 'true');
		await harness.choose('is-visible', 'false');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.q, model.isAvailable, model.isVisible, fixture.componentInstance.searches]).toEqual([
			'camp',
			'true',
			'false',
			1,
		]);
	});
});
