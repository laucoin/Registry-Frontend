import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { describe, expect, it } from 'vitest';

import { UserElementHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/user-element/testing/user-element.harness';
import { UserElementComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/user-element/user-element.component';
import { InvitedUserModel } from '@shared/models/model/invited-user.model';

const USER: InvitedUserModel = { id: 'u1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' };

describe('UserElementComponent', () => {
	async function create(user: InvitedUserModel): Promise<UserElementHarness> {
		const fixture = TestBed.createComponent(UserElementComponent);
		fixture.componentRef.setInput('user', user);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, UserElementHarness);
	}

	it.each([
		{
			name: 'a named user',
			user: USER,
			expected: { name: 'Ada LOVELACE', initials: 'AL', email: 'ada@example.org' },
		},
		{
			name: 'a user without a name by its email',
			user: { ...USER, firstName: undefined, lastName: undefined },
			expected: { name: 'ada@example.org', initials: 'A', email: 'ada@example.org' },
		},
	])('summarises $name', async ({ user, expected }) => {
		// Arrange
		const harness = await create(user);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual(expected);
	});
});
