import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { beforeEach, describe, expect, it } from 'vitest';

import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { SortFields } from '@shared/helpers/search/sort-query';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

@Component({
	selector: 'app-sort-fields-host',
	imports: [SortFieldsComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	template: '<app-sort-fields [sortBy]="form.sortBy" [sortDirection]="form.sortDirection" [fields]="fields"/>',
})
class HostComponent {
	public readonly model = signal<SortFields>({ sortBy: 'name', sortDirection: 'desc' });
	public readonly form = createSearchForm(this.model);
	public readonly fields: readonly string[] = ['name', 'begin'];
}

describe('SortFieldsComponent', () => {
	beforeEach(async () => {
		await MockBuilder(HostComponent)
			.keep(SortFieldsComponent)
			.keep(FormField)
			.keep(SgdfFieldDirective)
			.mock(TranslocoPipe, (key: string): string => key);
	});

	it('offers the default choice then each sortable field', () => {
		// Arrange
		const fixture = TestBed.createComponent(HostComponent);

		// Act
		fixture.detectChanges();
		const options = Array.from<HTMLElement & { value: string }>(
			fixture.nativeElement.querySelectorAll('[data-testid="sort-fields-by-select"] sgdf-option'),
		).map((option) => option.value);

		// Assert
		expect(options).toEqual(['', 'name', 'begin']);
	});

	it('offers the ascending and descending directions', () => {
		// Arrange
		const fixture = TestBed.createComponent(HostComponent);

		// Act
		fixture.detectChanges();
		const options = Array.from<HTMLElement & { value: string }>(
			fixture.nativeElement.querySelectorAll('[data-testid="sort-fields-direction-select"] sgdf-option'),
		).map((option) => option.value);

		// Assert
		expect(options).toEqual(['asc', 'desc']);
	});
});
