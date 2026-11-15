import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { toAlertsListSearchModel } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.search';
import { AlertsSearchFieldsComponent } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-search-fields/alerts-search-fields.component';
import { AlertsSearchFieldsHarness } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-search-fields/testing/alerts-search-fields.harness';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { createSearchForm } from '@shared/helpers/form/search.form';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [AlertsSearchFieldsComponent],
	templateUrl: './alerts-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toAlertsListSearchModel({
			q: undefined,
			status: undefined,
			isVisible: undefined,
			from: undefined,
			to: undefined,
			sort: undefined,
		}),
	);
	public readonly form = createSearchForm(this.model);
	public searches = 0;

	public searched(): void {
		this.searches += 1;
	}
}

describe('AlertsSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(authorities: string[]): Promise<AlertsSearchFieldsHarness> {
		TestBed.overrideProvider(SessionFacade, {
			useValue: { currentUser: signal({ authorities }), selectedProject: signal({ id: 'p1' }) },
		});
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AlertsSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: {} },
				{
					provide: AlertFacade,
					useValue: {
						alertStatusMetadata: signal([
							{ label: '-', value: undefined },
							{ label: 'Open', value: 'OPEN' },
						]),
						visibilitiesMetadata: signal(CHOICES),
					},
				},
			],
		});
	});

	it.each([
		{
			name: 'the visibility filter to a user who restores alerts',
			authorities: ['p1_REGISTRY_PROJECT_ALERT_RESTORE'],
			filters: ['status', 'is-visible'],
		},
		{ name: 'the status filter only to the others', authorities: [], filters: ['status'] },
	])('offers $name', async ({ authorities, filters }) => {
		// Arrange
		const harness = await create(authorities);

		// Act
		const shown = await harness.filters();

		// Assert
		expect(shown).toEqual(filters.map((filter) => `alerts-search-fields-${filter}-select`));
	});

	it('binds the typed text and the chosen filters to the form, and signals the validated search', async () => {
		// Arrange
		const harness = await create(['p1_REGISTRY_PROJECT_ALERT_RESTORE']);

		// Act
		await harness.search('fire');
		await harness.choose('status', 'OPEN');
		await harness.choose('is-visible', 'false');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.q, model.status, model.isVisible, fixture.componentInstance.searches]).toEqual([
			'fire',
			'OPEN',
			'false',
			1,
		]);
	});
});
