import { describe, expect, it } from 'vitest';

import {
	toActivitiesListSearchModel,
	toActivitiesListSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.search';

describe('activities-list search mapping', () => {
	it('turns absent parameters into empty form values', () => {
		// Arrange
		const params: Parameters<typeof toActivitiesListSearchModel>[0] = {
			q: undefined,
			at: undefined,
			isAvailable: undefined,
			isVisible: undefined,
			sort: undefined,
		};

		// Act
		const model = toActivitiesListSearchModel(params);

		// Assert
		expect(model).toEqual({ q: '', at: null, isAvailable: '', isVisible: '', sortBy: '', sortDirection: 'asc' });
	});

	it('turns the filled parameters into form values and back', () => {
		// Arrange
		const when = new Date(2026, 9, 3);
		const params: Parameters<typeof toActivitiesListSearchModel>[0] = {
			q: 'camp',
			at: when,
			isAvailable: false,
			isVisible: false,
			sort: undefined,
		};

		// Act
		const model = toActivitiesListSearchModel(params);

		// Assert
		expect(model.isAvailable).toBe('false');
		expect(toActivitiesListSearchParams(model)).toEqual(params);
	});

	it('turns empty form values into absent parameters', () => {
		// Arrange
		const model: ReturnType<typeof toActivitiesListSearchModel> = {
			q: '',
			at: null,
			isAvailable: '',
			isVisible: '',
			sortBy: '',
			sortDirection: 'asc',
		};

		// Act
		const params = toActivitiesListSearchParams(model);

		// Assert
		expect(params).toEqual({ q: undefined, at: undefined, isAvailable: undefined, isVisible: undefined });
	});
});
