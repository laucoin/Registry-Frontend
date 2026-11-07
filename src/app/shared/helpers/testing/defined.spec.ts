import { describe, expect, it } from 'vitest';

import { defined } from '@shared/helpers/testing/defined';

describe('defined', () => {
	it.each([[0], [''], [false]])('returns the falsy but present value %s', (value) => {
		// Arrange / Act
		const result = defined(value);

		// Assert
		expect(result).toBe(value);
	});

	it.each([[null], [undefined]])('throws when the value is %s', (value) => {
		// Arrange / Act
		const action = (): unknown => defined(value);

		// Assert
		expect(action).toThrow('Expected the value to be defined');
	});
});
