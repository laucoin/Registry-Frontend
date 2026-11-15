import { describe, expect, it } from 'vitest';

import { WidgetStateHelper } from '@shared/helpers/widget-state.helper';
import { WidgetStateEnum } from '@shared/models/enumeration/widget-state.enum';

describe('WidgetStateHelper', () => {
	it.each([
		{
			name: 'loading while nothing is known yet',
			loading: true,
			total: undefined,
			expected: WidgetStateEnum.LOADING,
		},
		{
			name: 'content when nothing is known and nothing loads',
			loading: false,
			total: undefined,
			expected: WidgetStateEnum.CONTENT,
		},
		{ name: 'empty for zero element', loading: true, total: 0, expected: WidgetStateEnum.EMPTY },
		{
			name: 'content for known elements, even while reloading',
			loading: true,
			total: 2,
			expected: WidgetStateEnum.CONTENT,
		},
	])('is $name', ({ loading, total, expected }) => {
		// Arrange
		const known = total;

		// Act
		const state = WidgetStateHelper.of(loading, known);

		// Assert
		expect(state).toBe(expected);
	});
});
