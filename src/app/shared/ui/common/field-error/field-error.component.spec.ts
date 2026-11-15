import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';

import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { FieldErrorState } from '@shared/helpers/form/field-state.helper';
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component';
import { FieldErrorHarness } from '@shared/ui/common/field-error/testing/field-error.harness';

function stateOf(
	errors: object[],
	overrides: Partial<Record<'invalid' | 'touched' | 'dirty', boolean>> = {},
	value: unknown = '',
): () => FieldErrorState {
	const state: FieldErrorState = {
		invalid: () => overrides.invalid ?? errors.length > 0,
		touched: () => overrides.touched ?? true,
		dirty: () => overrides.dirty ?? false,
		errors: () => errors as ValidationError[],
		value: () => value,
	};
	return () => state;
}

describe('FieldErrorComponent', () => {
	let translate: Mock<(key: string, params?: object) => string>;

	async function errorTextFor(field: () => FieldErrorState, translationArgs: object = {}): Promise<string> {
		const fixture = TestBed.createComponent(FieldErrorComponent);
		fixture.componentRef.setInput('field', field);
		fixture.componentRef.setInput('translationPrefix', 'form.error');
		fixture.componentRef.setInput('translationArgs', translationArgs);
		return (await TestbedHarnessEnvironment.harnessForFixture(fixture, FieldErrorHarness)).text();
	}

	beforeEach(() => {
		translate = vi.fn((key) => key);
		TestBed.configureTestingModule({ providers: [{ provide: TranslocoService, useValue: { translate } }] });
	});

	it('shows nothing while the field is valid, or invalid but still pristine and untouched', async () => {
		// Arrange
		const valid = stateOf([]);
		const pristine = stateOf([{ kind: 'required' }], { touched: false, dirty: false });

		// Act
		const results = [await errorTextFor(valid), await errorTextFor(pristine)];

		// Assert
		expect(results).toEqual(['', '']);
		expect(translate).not.toHaveBeenCalled();
	});

	it.each([
		['touched', { touched: true, dirty: false }],
		['dirty', { touched: false, dirty: true }],
	])('translates the first error kind once the field is %s', async (_, flags) => {
		// Arrange
		const field = stateOf([{ kind: 'required' }, { kind: 'blank' }], flags);

		// Act
		const text = await errorTextFor(field);

		// Assert
		expect(text).toBe('form.error.required');
	});

	it.each([
		['maxLength', { kind: 'maxLength', maxLength: 5 }, 'maxlength', { requiredLength: 5, actualLength: 8 }],
		['minLength', { kind: 'minLength', minLength: 3 }, 'minlength', { requiredLength: 3, actualLength: 8 }],
	])(
		'maps the native %s error to the legacy translation key and length parameters',
		async (_, error: object, key, expected: object) => {
			// Arrange
			const field = stateOf([error], {}, 'abcdefgh');

			// Act
			await errorTextFor(field);

			// Assert
			expect(translate).toHaveBeenCalledWith(`form.error.${key}`, expected);
		},
	);

	it.each([
		[
			{ kind: 'min', min: 1, actual: 0 },
			{ min: 1, actual: 0 },
		],
		[
			{ kind: 'max', max: 9, actual: 10 },
			{ max: 9, actual: 10 },
		],
		[{ kind: 'minDate', min: '2026-01-01' }, { min: '2026-01-01' }],
		[{ kind: 'maxDate', max: '2026-12-31' }, { max: '2026-12-31' }],
		[
			{ kind: 'rangeMin', min: 2, actual: 1 },
			{ min: 2, actual: 1 },
		],
		[{ kind: 'incompatibleReason', reason: 'why' }, { reason: 'why' }],
		[
			{ kind: 'preRequiredOptions', for: 'A', missing: 'B' },
			{ for: 'A', missing: 'B' },
		],
		[{ kind: 'blank' }, {}],
	])('passes the parameters of %j to the translation', async (error: object, expected: object) => {
		// Arrange
		const field = stateOf([error]);

		// Act
		await errorTextFor(field, { field: 'name' });

		// Assert
		expect(translate).toHaveBeenCalledWith(expect.any(String), { field: 'name', ...expected });
	});
});
