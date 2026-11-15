import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { FieldErrorState } from '@shared/helpers/form/field-state.helper';
import { NumericRangeModel } from '@shared/models/model/numeric-range.model';
import { NumberRangeFieldComponent } from '@shared/ui/common/number-range-field/number-range-field.component';
import {
	NumberRangeBoundEnum,
	NumberRangeFieldHarness,
} from '@shared/ui/common/number-range-field/testing/number-range-field.harness';

import '@sgdf/ui/number-input';

function stateOf(errors: object[]): () => FieldErrorState {
	const state: FieldErrorState = {
		invalid: () => errors.length > 0,
		touched: () => true,
		dirty: () => false,
		errors: () => errors as ValidationError[],
		value: () => null,
	};
	return () => state;
}

describe('NumberRangeFieldComponent', () => {
	let fixture: ComponentFixture<NumberRangeFieldComponent>;
	let touches: number;

	async function create(inputs: Record<string, unknown> = {}): Promise<NumberRangeFieldHarness> {
		fixture = TestBed.createComponent(NumberRangeFieldComponent);
		Object.entries({ appFieldError: stateOf([]), translationPrefix: 'form.error', ...inputs }).forEach(
			([name, value]) => fixture.componentRef.setInput(name, value),
		);
		touches = 0;
		fixture.componentInstance.touch.subscribe(() => touches++);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, NumberRangeFieldHarness);
	}

	const value = (): NumericRangeModel | null => fixture.componentInstance.value();

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('shows the bounds of the value', async () => {
		// Arrange
		const range: NumericRangeModel = { lower: 1, upper: 5 };

		// Act
		const harness = await create({ value: range });

		// Assert
		expect([await harness.value(NumberRangeBoundEnum.MIN), await harness.value(NumberRangeBoundEnum.MAX)]).toEqual([
			'1',
			'5',
		]);
	});

	it.each([
		{
			name: 'combines a new minimum with the current maximum',
			bound: NumberRangeBoundEnum.MIN,
			typed: '2',
			expected: { lower: 2, upper: 5 },
		},
		{
			name: 'combines a new maximum with the current minimum',
			bound: NumberRangeBoundEnum.MAX,
			typed: '8',
			expected: { lower: 1, upper: 8 },
		},
	])('$name', async ({ bound, typed, expected }) => {
		// Arrange
		const harness = await create({ value: { lower: 1, upper: 5 } });

		// Act
		await harness.type(bound, typed);

		// Assert
		expect(value()).toEqual(expected);
		expect(touches).toBe(1);
	});

	it('has no range when both bounds are cleared', async () => {
		// Arrange
		const harness = await create({ value: { lower: 1, upper: undefined } });

		// Act
		await harness.type(NumberRangeBoundEnum.MIN, '');

		// Assert
		expect(value()).toBeNull();
		expect(await harness.value(NumberRangeBoundEnum.MIN)).toBe('');
	});

	it('names each bound with the default labels', async () => {
		// Arrange
		const harness = await create();

		// Act
		const labels = [await harness.label(NumberRangeBoundEnum.MIN), await harness.label(NumberRangeBoundEnum.MAX)];

		// Assert
		expect(labels).toEqual(['fr.global.form.range.min', 'fr.global.form.range.max']);
	});

	it('shows the error of the field on the range', async () => {
		// Arrange
		const field = stateOf([{ kind: 'rangeMin', min: 2, actual: 1 }]);

		// Act
		const harness = await create({ appFieldError: field });

		// Assert
		expect(await harness.error()).toBe('fr.form.error.rangeMin');
	});

	it('follows the disabled state of the form', async () => {
		// Arrange
		const inputs = { disabled: true };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.disabled()).toBe(true);
	});

	it('marks the field touched when the user leaves a bound', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.leave(NumberRangeBoundEnum.MAX);

		// Assert
		expect(touches).toBe(1);
	});
});
