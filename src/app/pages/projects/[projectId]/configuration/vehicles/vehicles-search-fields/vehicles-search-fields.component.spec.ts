import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { toVehiclesListSearchModel } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search';
import { VehiclesSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-search-fields/testing/vehicles-search-fields.harness';
import { VehiclesSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-search-fields/vehicles-search-fields.component';
import { createSearchForm } from '@shared/helpers/form/search.form';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [VehiclesSearchFieldsComponent],
	templateUrl: './vehicles-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toVehiclesListSearchModel({
			q: undefined,
			at: undefined,
			status: undefined,
			isVisible: undefined,
			sort: undefined,
		}),
	);
	public readonly form = createSearchForm(this.model);
	public searches = 0;
}

describe('VehiclesSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(authorities: string[]): Promise<VehiclesSearchFieldsHarness> {
		TestBed.overrideProvider(SessionFacade, {
			useValue: { currentUser: signal({ authorities }), selectedProject: signal({ id: 'p1' }) },
		});
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(VehiclesSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: {} },
				{
					provide: VehicleFacade,
					useValue: {
						presencesStatusMetadata: signal([
							{ label: '-', value: undefined },
							{ label: 'In', value: 'IN' },
						]),
						visibilitiesMetadata: signal(CHOICES),
					},
				},
			],
		});
	});

	it.each([
		{
			name: 'the visibility filter to a user who restores them',
			authorities: ['p1_REGISTRY_PROJECT_VEHICLE_RESTORE'],
			filters: ['status', 'is-visible'],
		},
		{ name: 'no visibility filter to the others', authorities: [], filters: ['status'] },
	])('offers $name', async ({ authorities, filters }) => {
		// Arrange
		const harness = await create(authorities);

		// Act
		const shown = await harness.filters();

		// Assert
		expect(shown).toEqual(filters.map((filter) => `vehicles-search-fields-${filter}-select`));
	});

	it('binds the typed text and the chosen filters to the form, and signals the validated search', async () => {
		// Arrange
		const harness = await create(['p1_REGISTRY_PROJECT_VEHICLE_RESTORE']);

		// Act
		await harness.search('camp');
		await harness.choose('status', 'IN');
		await harness.choose('is-visible', 'false');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.q, model.status, model.isVisible, fixture.componentInstance.searches]).toEqual([
			'camp',
			'IN',
			'false',
			1,
		]);
	});
});
