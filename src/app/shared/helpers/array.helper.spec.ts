import { describe, expect, it } from 'vitest';

import { ArrayHelper } from './array.helper';

describe('ArrayHelper', () => {
	it.each([
		{ name: 'a missing array', array: undefined, expected: true },
		{ name: 'an empty array', array: [], expected: true },
		{ name: 'a filled array', array: [1], expected: false },
	])('tells whether $name is null or empty', ({ array, expected }) => {
		// Arrange
		const input: number[] | undefined = array;

		// Act
		const result = ArrayHelper.isNullOrEmpty(input);

		// Assert
		expect(result).toBe(expected);
	});

	it.each([
		{ name: 'finds a present value', value: 'a', expected: true },
		{ name: 'misses an absent value', value: 'b', expected: false },
	])('$name in strict mode', ({ value, expected }) => {
		// Arrange
		const array = ['a'];

		// Act
		const result = ArrayHelper.includes(array, value, true);

		// Assert
		expect(result).toBe(expected);
	});

	it('splits an array into chunks of the given size', () => {
		// Arrange
		const array = [1, 2, 3, 4, 5];

		// Act
		const chunks = ArrayHelper.chunk(array, 2);

		// Assert
		expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
	});

	it.each([
		{ name: 'a missing array', array: undefined },
		{ name: 'an empty array', array: [] },
	])('keeps a single empty chunk for $name', ({ array }) => {
		// Arrange
		const input: number[] | undefined = array;

		// Act
		const chunks: number[][] = ArrayHelper.chunk(input, 2);

		// Assert
		expect(chunks).toEqual([[]]);
	});
});
