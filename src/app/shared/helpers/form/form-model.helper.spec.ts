import { describe, expect, it } from 'vitest';

import { FormModelHelper } from '@shared/helpers/form/form-model.helper';

describe('FormModelHelper', () => {
	it('copies every item deeply so the source objects stay untouched', () => {
		// Arrange
		const source = [{ id: 'a', tags: [{ name: 'x' }] }];

		// Act
		const copies = FormModelHelper.copyItems(source);
		const tag = Symbol('tag');
		(copies[0].tags[0] as Record<symbol, unknown>)[tag] = true;

		// Assert
		expect(copies).not.toBe(source);
		expect(copies[0].tags[0]).not.toBe(source[0].tags[0]);
		expect(Object.getOwnPropertySymbols(source[0].tags[0])).toEqual([]);
	});

	it('gives an empty list when there is nothing to copy', () => {
		// Arrange
		const source = undefined;

		// Act
		const copies = FormModelHelper.copyItems(source);

		// Assert
		expect(copies).toEqual([]);
	});

	it('copies a single value deeply', () => {
		// Arrange
		const source = { label: 'l', value: { items: [1] } };

		// Act
		const copy = FormModelHelper.copy(source);

		// Assert
		expect(copy).toEqual(source);
		expect(copy.value.items).not.toBe(source.value.items);
	});

	it('exposes each option as its own selected value', () => {
		// Arrange
		const options = [{ label: 'one', value: 1 }];

		// Act
		const selectable = FormModelHelper.selectable(options);

		// Assert
		expect(selectable[0].self).toBe(options[0]);
		expect(selectable[0].label).toBe('one');
	});

	it.each([
		{ name: 'replaces an undefined text with an empty string', text: undefined, expected: '' },
		{ name: 'replaces a null text with an empty string', text: null, expected: '' },
		{ name: 'keeps a present text', text: 'text', expected: 'text' },
	])('$name', ({ text, expected }) => {
		// Arrange
		const source: string | null | undefined = text;

		// Act
		const result = FormModelHelper.orEmpty(source);

		// Assert
		expect(result).toBe(expected);
	});

	it('replaces a missing value with null and keeps a present one', () => {
		// Arrange
		const missing: number | undefined = undefined;

		// Act
		const results = [
			FormModelHelper.orNull<number>(missing),
			FormModelHelper.orNull<number>(null),
			FormModelHelper.orNull(0),
		];

		// Assert
		expect(results).toEqual([null, null, 0]);
	});
});
