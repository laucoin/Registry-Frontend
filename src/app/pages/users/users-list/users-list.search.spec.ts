import { describe, expect, it } from 'vitest';

import { toUsersListSearchModel, toUsersListSearchParams } from '@pages/users/users-list/users-list.search';

describe('users list search mapping', () => {
	it('turns absent parameters into empty form values', () => {
		// Arrange
		const params: Parameters<typeof toUsersListSearchModel>[0] = {
			q: undefined,
			isVisible: undefined,
			sort: undefined,
		};

		// Act
		const model = toUsersListSearchModel(params);

		// Assert
		expect(model).toEqual({ q: '', isVisible: '', sortBy: '', sortDirection: 'asc' });
	});

	it('turns the visibility into the value of its select option and back', () => {
		// Arrange
		const blocked: Parameters<typeof toUsersListSearchModel>[0] = { q: 'ada', isVisible: false, sort: undefined };

		// Act
		const model = toUsersListSearchModel(blocked);

		// Assert
		expect(model.isVisible).toBe('false');
		expect(toUsersListSearchParams(model)).toEqual(blocked);
	});

	it('turns empty form values into absent parameters', () => {
		// Arrange
		const model: ReturnType<typeof toUsersListSearchModel> = {
			q: '',
			isVisible: '',
			sortBy: '',
			sortDirection: 'asc',
		};

		// Act
		const params = toUsersListSearchParams(model);

		// Assert
		expect(params).toEqual({ q: undefined, isVisible: undefined });
	});
});
