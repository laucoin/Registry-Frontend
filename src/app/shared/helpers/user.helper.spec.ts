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
		// Arrange
		const upperEmail = 'Ada@X.test';
		const lowerEmail = 'ada@x.test';

		// Act
		const upper = UserHelper.toInvitedByEmail(upperEmail);
		const lower = UserHelper.toInvitedByEmail(lowerEmail);

		// Assert
		expect(upper.id).toBe(lower.id);
		expect(upper).toEqual(
			expect.objectContaining({ email: 'Ada@X.test', firstName: undefined, lastName: undefined }),
		);
	});

	it.each([
		{
			name: 'first and last names',
			firstName: 'Ada',
			lastName: 'Lovelace',
			fullName: 'Ada LOVELACE',
			initials: 'AL',
		},
		{ name: 'a first name only', firstName: 'Ada', lastName: undefined, fullName: 'Ada', initials: 'A' },
		{ name: 'a last name only', firstName: undefined, lastName: 'Lovelace', fullName: 'LOVELACE', initials: 'L' },
		{ name: 'no name', firstName: undefined, lastName: undefined, fullName: 'ada@x.test', initials: 'A' },
	])('names a user with $name', ({ firstName, lastName, fullName, initials }) => {
		// Arrange
		const user: InvitedUserModel = { id: 'u1', email: 'ada@x.test', firstName, lastName };

		// Act
		const shown = [UserHelper.fullName(user), UserHelper.initials(user)];

		// Assert
		expect(shown).toEqual([fullName, initials]);
	});
});
