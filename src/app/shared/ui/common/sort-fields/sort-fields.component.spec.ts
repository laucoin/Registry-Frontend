import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { createSearchForm } from '@shared/helpers/form/search.form';
import { SortFields } from '@shared/helpers/search/sort-query';
import { SortDirectionEnum } from '@shared/models/enumeration/sort-direction.enum';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';
import { SortFieldsHarness } from '@shared/ui/common/sort-fields/testing/sort-fields.harness';

import '@sgdf/ui/option';
import '@sgdf/ui/select';

@Component({
	imports: [SortFieldsComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	template: '<app-sort-fields [sortBy]="form.sortBy" [sortDirection]="form.sortDirection" [fields]="fields"/>',
})
class HostComponent {
	public readonly model = signal<SortFields>({ sortBy: 'name', sortDirection: SortDirectionEnum.DESC });
	public readonly form = createSearchForm(this.model);
	public readonly fields: readonly string[] = ['name', 'begin'];
}

describe('SortFieldsComponent', () => {
	async function create(): Promise<SortFieldsHarness> {
		const fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, SortFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('offers the default choice then each sortable field', async () => {
		// Arrange
		const harness = await create();

		// Act
		const choices = await harness.fieldChoices();

		// Assert
		expect(choices).toEqual(['', 'name', 'begin']);
	});

	it('offers the ascending and descending directions', async () => {
		// Arrange
		const harness = await create();

		// Act
		const choices = await harness.directionChoices();

		// Assert
		expect(choices).toEqual(['asc', 'desc']);
	});

	it('shows the sort held by the search form', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.field(), await harness.direction()];

		// Assert
		expect(shown).toEqual(['name', 'desc']);
	});
});
