import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { toMovementsListSearchModel } from '@pages/projects/[projectId]/movements/movements-list/movements-list.search';
import { MovementsSearchFieldsComponent } from '@pages/projects/[projectId]/movements/movements-list/movements-search-fields/movements-search-fields.component';
import { MovementsSearchFieldsHarness } from '@pages/projects/[projectId]/movements/movements-list/movements-search-fields/testing/movements-search-fields.harness';
import { createSearchForm } from '@shared/helpers/form/search.form';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [MovementsSearchFieldsComponent],
	templateUrl: './movements-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toMovementsListSearchModel({
			type: undefined,
			from: undefined,
			to: undefined,
			isVisible: undefined,
			sort: undefined,
		}),
	);
	public readonly form = createSearchForm(this.model);
}

describe('MovementsSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(authorities: string[]): Promise<MovementsSearchFieldsHarness> {
		TestBed.overrideProvider(SessionFacade, {
			useValue: { currentUser: signal({ authorities }), selectedProject: signal({ id: 'p1' }) },
		});
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementsSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: {} },
				{
					provide: MovementFacade,
					useValue: {
						movementTypesMetadata: signal([
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
			name: 'the visibility filter to a user who restores movements',
			authorities: ['p1_REGISTRY_PROJECT_MOVEMENT_RESTORE'],
			filters: ['type', 'is-visible'],
		},
		{ name: 'the type filter only to the others', authorities: [], filters: ['type'] },
	])('offers $name', async ({ authorities, filters }) => {
		// Arrange
		const harness = await create(authorities);

		// Act
		const shown = await harness.filters();

		// Assert
		expect(shown).toEqual(filters.map((filter) => `movements-search-fields-${filter}-select`));
	});

	it('binds the chosen filters to the form', async () => {
		// Arrange
		const harness = await create(['p1_REGISTRY_PROJECT_MOVEMENT_RESTORE']);

		// Act
		await harness.choose('type', 'IN');
		await harness.choose('is-visible', 'true');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.type, model.isVisible]).toEqual(['IN', 'true']);
	});
});
