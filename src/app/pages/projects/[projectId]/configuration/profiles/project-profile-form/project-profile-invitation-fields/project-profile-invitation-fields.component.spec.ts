import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import {
	createProjectProfileInvitationForm,
	toProjectProfileInvitationFormModel,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form';
import { ProjectProfileInvitationFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/project-profile-invitation-fields.component';
import { ProjectProfileInvitationFieldsHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/testing/project-profile-invitation-fields.harness';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

const INVITE = 'fr.project-profiles.form.users.invite';
const ADA: SelectOptionModel<UserModel> = {
	label: 'Ada Lovelace',
	value: { id: 'u1', email: 'ada@x.test', firstName: 'Ada', lastName: 'Lovelace' } as UserModel,
};

@Component({
	imports: [ProjectProfileInvitationFieldsComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	template: '<app-project-profile-invitation-fields [fields]="form" [projectId]="projectId()" />',
})
class HostComponent {
	public readonly projectId = input<string | undefined>();
	public readonly model = signal(toProjectProfileInvitationFormModel());
	public readonly form = createProjectProfileInvitationForm(this.model);
}

describe('ProjectProfileInvitationFieldsComponent', () => {
	let roles: WritableSignal<{ label: string; value: string }[]>;
	let rolesLoading: WritableSignal<boolean>;
	let searched: WritableSignal<SelectOptionModel<UserModel>[]>;
	let inviteByEmailEnabled: WritableSignal<boolean>;
	let searchUsers: Mock;
	let fetchFeatures: Mock;
	let host: HostComponent;

	async function create(projectId?: string): Promise<ProjectProfileInvitationFieldsHarness> {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentRef.setInput('projectId', projectId);
		host = fixture.componentInstance;
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectProfileInvitationFieldsHarness);
	}

	beforeEach(() => {
		roles = signal([
			{ label: 'Chief', value: 'CHIEF' },
			{ label: 'Member', value: 'MEMBER' },
		]);
		rolesLoading = signal(false);
		searched = signal([]);
		inviteByEmailEnabled = signal(true);
		searchUsers = vi.fn();
		fetchFeatures = vi.fn();
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{
					provide: ProjectProfileFacade,
					useValue: {
						projectProfileAssignableRolesMetadata: roles,
						projectProfileAssignableRolesLoading: rolesLoading,
						searchedUsersMetadata: searched,
						inviteByEmailEnabled,
						selectedProjectId: (): string => 'selected',
						searchUsers,
						fetchFeatures,
					},
				},
				{ provide: DatePipe, useValue: { transform: (): string => '' } },
			],
		});
	});

	it('loads the features and lists the assignable roles, suggesting the first one', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.roles(), await harness.rolePlaceholder()];

		// Assert
		expect([shown, fetchFeatures.mock.calls.length]).toEqual([
			[['Chief', 'Member'], 'fr.project-profiles.form.placeholder.role'],
			1,
		]);
	});

	it.each([
		{ name: 'shows the roles as loading until they arrive', loading: true },
		{ name: 'shows the roles as loaded once they arrive', loading: false },
	])('$name', async ({ loading }) => {
		// Arrange
		rolesLoading.set(loading);
		const harness = await create();

		// Act
		const shown = await harness.rolesLoading();

		// Assert
		expect(shown).toBe(loading);
	});

	it('binds the chosen role to the form', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.chooseRole('MEMBER');

		// Assert
		expect(host.model().role).toBe('MEMBER');
	});

	it.each([
		{ name: 'the given project', projectId: 'created', expected: 'created' },
		{ name: 'the selected project when none is given', projectId: undefined, expected: 'selected' },
	])('searches the users to invite into $name', async ({ projectId, expected }) => {
		// Arrange
		const harness = await create(projectId);

		// Act
		await (await harness.users()).search(' ada@x.test ');

		// Assert
		expect(searchUsers.mock.calls).toEqual([['ada@x.test', expected]]);
	});

	it.each([
		{ name: 'an empty search', query: '' },
		{ name: 'a fragment of a name', query: 'ada' },
		{ name: 'an incomplete address', query: 'ada@x' },
	])('does not search the users for $name', async ({ query }) => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.users()).search(query);

		// Assert
		expect(searchUsers.mock.calls).toEqual([]);
	});

	it.each([
		{ name: 'an address that matches no user', found: [], query: ' new@x.test ', expected: [INVITE] },
		{
			name: 'only the invitation when the found user answers an earlier search',
			found: [ADA],
			query: 'new@x.test',
			expected: [INVITE],
		},
		{ name: 'nothing for a text that is not an address', found: [], query: 'ada', expected: [] },
		{
			name: 'only the user an address already matches',
			found: [ADA],
			query: 'ADA@x.test',
			expected: ['Ada Lovelace'],
		},
	])('suggests $name', async ({ found, query, expected }) => {
		// Arrange
		searched.set(found);
		const harness = await create();

		// Act
		await (await harness.users()).search(query);

		// Assert
		expect(await (await harness.users()).suggestions()).toEqual(expected);
	});

	it.each([
		{ name: 'invites by email when the feature is on', enabled: true, expected: 'empty-invite' },
		{ name: 'only reports the absence of users when it is off', enabled: false, expected: 'empty-search' },
	])('$name', async ({ enabled, expected }) => {
		// Arrange
		inviteByEmailEnabled.set(enabled);
		const harness = await create();

		// Act
		const label = await (await harness.users()).noResultsLabel();

		// Assert
		expect(label).toBe(`fr.project-profiles.form.users.${expected}`);
	});

	it('suggests no invitation by email when the feature is off', async () => {
		// Arrange
		inviteByEmailEnabled.set(false);
		const harness = await create();

		// Act
		await (await harness.users()).search('new@x.test');

		// Assert
		expect(await (await harness.users()).suggestions()).toEqual([]);
	});

	it('tells that no user is selected yet', async () => {
		// Arrange
		const harness = await create();

		// Act
		const message = await (await harness.users()).emptyMessage();

		// Assert
		expect(message?.trim()).toBe('fr.project-profiles.form.users.empty');
	});

	it('titles the invited users', async () => {
		// Arrange
		const harness = await create();

		// Act
		const title = await harness.usersTitle();

		// Assert
		expect(title).toBe('fr.project-profiles.form.users.one');
	});
});
