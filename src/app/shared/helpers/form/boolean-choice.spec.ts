import { describe, expect, it } from 'vitest';

import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';

describe('boolean choice', () => {
	it.each([
		[undefined, ''],
		[true, 'true'],
		[false, 'false'],
	])('turns %s into the option value "%s" and back', (value, choice) => {
		// Arrange
		const expected = choice as BooleanChoice;

		// Act
		const forth = toBooleanChoice(value);
		const back = fromBooleanChoice(forth);

		// Assert
		expect(forth).toBe(expected);
		expect(back).toBe(value);
	});
});
