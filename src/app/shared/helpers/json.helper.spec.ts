import { describe, expect, it } from 'vitest';

import { Utils } from '@shared/helpers/json.helper';

describe('Utils', () => {
	it.each(['{"a":1}', '[1,2]'])('recognizes %s as JSON', (item) => {
		// Arrange
		const candidate = item;

		// Act
		const result = Utils.isJson(candidate);

		// Assert
		expect(result).toBe(true);
	});

	it.each(['plain text', '42', 'null', '', null])('does not take %s for a JSON object', (item) => {
		// Arrange
		const candidate = item;

		// Act
		const result = Utils.isJson(candidate);

		// Assert
		expect(result).toBe(false);
	});

	it('tells objects from primitives and null', () => {
		// Arrange
		const values: unknown[] = [{}, [], 'a', 1, null, undefined];

		// Act
		const results = values.map((value: unknown) => Utils.isObject(value));

		// Assert
		expect(results).toEqual([true, true, false, false, false, false]);
	});
});
