import { describe, expect, it } from 'vitest';

import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';

interface Params {
	q?: string | undefined;
	isVisible?: boolean | undefined;
}

describe('SearchParamsHelper', () => {
	it('reports no change when every provided parameter equals the stored one', () => {
		// Arrange
		const current: Params = { q: 'bus', isVisible: true };

		// Act
		const result = SearchParamsHelper.hasChanged(current, { q: 'bus', isVisible: true });

		// Assert
		expect(result).toBe(false);
	});

	it('reports a change when one provided parameter differs', () => {
		// Arrange
		const current: Params = { q: 'bus', isVisible: true };

		// Act
		const result = SearchParamsHelper.hasChanged(current, { q: 'van', isVisible: true });

		// Assert
		expect(result).toBe(true);
	});

	it('treats a missing stored parameter as equal to an undefined one', () => {
		// Arrange
		const current: Params = {};

		// Act
		const result = SearchParamsHelper.hasChanged(current, { q: undefined });

		// Assert
		expect(result).toBe(false);
	});

	it('ignores the stored parameters that are not provided', () => {
		// Arrange
		const current: Params = { q: 'bus', isVisible: true };

		// Act
		const result = SearchParamsHelper.hasChanged(current, {});

		// Assert
		expect(result).toBe(false);
	});
});
