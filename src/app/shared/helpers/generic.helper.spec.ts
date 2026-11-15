import { describe, expect, it } from 'vitest';

import { GenericHelper } from '@shared/helpers/generic.helper';

describe('GenericHelper', () => {
	it.each([[null], [undefined]])('detects %s as null', (value) => {
		// Arrange

		// Act
		const result = GenericHelper.isNull(value);

		// Assert
		expect(result).toBe(true);
		expect(GenericHelper.nonNull(value)).toBe(false);
	});

	it.each([[0], [''], [false]])('keeps the falsy value %s as non null', (value) => {
		// Arrange

		// Act
		const result = GenericHelper.nonNull(value);

		// Assert
		expect(result).toBe(true);
		expect(GenericHelper.isNull(value)).toBe(false);
	});

	it('returns the value required when it is present', () => {
		// Arrange
		const value = 'present';

		// Act
		const result: string = GenericHelper.require(value, 'field');

		// Assert
		expect(result).toBe('present');
	});

	it.each([[null], [undefined]])('throws naming the field when the required value is %s', (value) => {
		// Arrange

		// Act
		const action = (): unknown => GenericHelper.require(value, 'birthday');

		// Assert
		expect(action).toThrow('Missing required value: birthday');
	});
});
