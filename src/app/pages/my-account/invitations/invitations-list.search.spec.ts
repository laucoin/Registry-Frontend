import { describe, expect, it } from 'vitest';

import {
	toInvitationsListSearchModel,
	toInvitationsListSearchParams,
} from '@pages/my-account/invitations/invitations-list.search';
import { SortDirectionEnum } from '@shared/models/enumeration/sort-direction.enum';

describe('invitations list search mapping', () => {
	it('turns absent parameters into empty form values and back', () => {
		// Arrange
		const params: Parameters<typeof toInvitationsListSearchModel>[0] = {
			q: undefined,
			at: undefined,
			sort: undefined,
		};

		// Act
		const model = toInvitationsListSearchModel(params);

		// Assert
		expect(model).toEqual({ q: '', at: null, sortBy: '', sortDirection: SortDirectionEnum.ASC });
		expect(toInvitationsListSearchParams(model)).toEqual(params);
	});

	it('keeps the text and the date the user filled', () => {
		// Arrange
		const when = new Date(2026, 9, 3);
		const params: Parameters<typeof toInvitationsListSearchModel>[0] = { q: 'camp', at: when, sort: undefined };

		// Act
		const model = toInvitationsListSearchModel(params);

		// Assert
		expect(model).toEqual({ q: 'camp', at: when, sortBy: '', sortDirection: SortDirectionEnum.ASC });
		expect(toInvitationsListSearchParams(model)).toEqual(params);
	});
});
