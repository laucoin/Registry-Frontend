import { describe, expect, it } from 'vitest';

import { StringHelper } from '@shared/helpers/string.helper';

describe('StringHelper', () => {
	it.each([
		{ name: 'a url without query', url: 'settings/config.json', expected: /^settings\/config\.json\?cache-bust=/ },
		{
			name: 'a url with a query',
			url: 'settings/config.json?lang=fr',
			expected: /^settings\/config\.json\?lang=fr&cache-bust=/,
		},
	])('appends a cache-busting parameter to $name', ({ url, expected }) => {
		// Arrange
		const source = url;

		// Act
		const result = StringHelper.addCacheBustingToUrl(source);

		// Assert
		expect(result).toMatch(expected);
	});

	it.each([
		[undefined, 5, '', ''],
		['short', 10, '', 'short'],
		['a long sentence', 6, '', 'a long'],
		['a long sentence', 6, '…', 'a long…'],
	])('truncates %s to %i characters', (text, max, tail, expected) => {
		// Arrange
		const input = text;

		// Act
		const result = StringHelper.truncate(input, max, tail);

		// Assert
		expect(result).toBe(expected);
	});

	it.each([
		{ name: 'missing text', text: undefined, expected: [false, true, false] },
		{ name: 'empty text', text: '', expected: [true, true, false] },
		{ name: 'blank text', text: '   ', expected: [true, true, false] },
		{ name: 'filled text', text: 'x', expected: [false, false, true] },
	])('classifies $name as blank, null or blank, and neither', ({ text, expected }) => {
		// Arrange
		const input: string | undefined = text;

		// Act
		const result = [
			StringHelper.isBlank(input),
			StringHelper.isNullOrBlank(input),
			StringHelper.isNotNullNorBlank(input),
		];

		// Assert
		expect(result).toEqual(expected);
	});

	it('recognizes an email address and rejects what is not one', () => {
		// Arrange
		const samples = [
			'ada@x.test',
			'a.b+c@sub.x.test',
			undefined,
			'',
			'ada',
			'ada@x',
			'ada @x.test',
			`${'a'.repeat(320)}@x.test`,
		];

		// Act
		const result = samples.map((text) => StringHelper.isEmail(text));

		// Assert
		expect(result).toEqual([true, true, false, false, false, false, false, false]);
	});

	it('converts numbers and numeric strings but leaves missing values undefined', () => {
		// Arrange
		const samples = [12, '34', null, undefined];

		// Act
		const results = samples.map((value) => StringHelper.toNumber(value));

		// Assert
		expect(results).toEqual([12, 34, undefined, undefined]);
	});

	it('keeps decimals and drops non numeric strings', () => {
		// Arrange
		const samples = ['1.5', 'abc'];

		// Act
		const results = samples.map((value) => StringHelper.toNumber(value));

		// Assert
		expect(results).toEqual([1.5, undefined]);
	});

	it('pads digits to the requested width', () => {
		// Arrange
		const value = 7;

		// Act
		const padded = StringHelper.formatDigits(value, 3);

		// Assert
		expect(padded).toBe('007');
	});

	it.each([
		{ name: 'the first letters of the words', text: 'camp des loups', expected: 'CDL' },
		{ name: 'no more letters than asked', text: 'grand camp des loups', expected: 'GCD' },
		{ name: 'the start of a single word', text: '  camp  ', expected: 'CAM' },
		{ name: 'a short single word whole', text: 'ok', expected: 'OK' },
		{ name: 'whole emojis of the words', text: '🔥 feu de camp', expected: '🔥FD' },
		{ name: 'whole emojis of a single word', text: '🔥🔥🔥🔥', expected: '🔥🔥🔥' },
	])('builds initials from $name', ({ text, expected }) => {
		// Arrange
		const maxLength = 3;

		// Act
		const initials = StringHelper.initials(text, maxLength);

		// Assert
		expect(initials).toBe(expected);
	});
});
