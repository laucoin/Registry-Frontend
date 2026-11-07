import { describe, expect, it } from 'vitest';

import { UserHelper } from '@shared/helpers/user.helper';
import { InvitedUserModel } from '@shared/models/model/invited-user.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

describe('UserHelper', () => {
	it('labels a user with its email and its name', () => {
		// Arrange
		const user: InvitedUserModel = { id: 'u1', email: 'ada@x.test', firstName: 'Ada', lastName: 'L' };

		// Act
		const item: SelectOptionModel<InvitedUserModel> = UserHelper.toSelectItem(user);

		// Assert
		expect(item).toEqual({ label: 'ada@x.test (Ada L)', value: user });
	});

	it('labels a user without any name with its email only', () => {
		// Arrange
		const user: InvitedUserModel = { id: 'u1', email: 'ada@x.test', firstName: undefined, lastName: undefined };

		// Act
		const item: SelectOptionModel<InvitedUserModel> = UserHelper.toSelectItem(user);

		// Assert
		expect(item.label).toBe('ada@x.test');
	});

	it('builds an invited by email user with a stable id per address', () => {
		// Arrange & Act
		const upper = UserHelper.toInvitedByEmail('Ada@X.test');
		const lower = UserHelper.toInvitedByEmail('ada@x.test');

		// Assert
		expect(upper.id).toBe(lower.id);
		expect(upper).toEqual(
			expect.objectContaining({ email: 'Ada@X.test', firstName: undefined, lastName: undefined }),
		);
	});
});
