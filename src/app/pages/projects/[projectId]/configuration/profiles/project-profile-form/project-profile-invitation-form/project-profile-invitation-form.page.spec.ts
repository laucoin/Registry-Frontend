import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe, Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfileInvitationFormPage } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-form/project-profile-invitation-form.page';
import { ProjectProfileInvitationFormHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-form/testing/project-profile-invitation-form.harness';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { ERROR_500, failing, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

const GRACE: SelectOptionModel<UserModel> = {
	label: 'Grace H',
	value: { id: 'u1', email: 'g@x.test', firstName: 'Grace', lastName: 'H' } as UserModel,
};

describe('ProjectProfileInvitationFormPage', () => {
	let facade: Record<string, unknown>;
	let back: Mock;

	async function create(): Promise<ProjectProfileInvitationFormHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectProfileInvitationFormPage),
			ProjectProfileInvitationFormHarness,
		);
	}

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	async function fill(harness: ProjectProfileInvitationFormHarness): Promise<void> {
		const fields = await harness.fields();
		await fields.chooseRole('CHIEF');
		const users = await fields.users();
		await users.search('g@x.test');
		await users.choose('u1');
	}

	beforeEach(() => {
		provideTestConfig();
		back = vi.fn();
		facade = {
			projectProfileAssignableRolesMetadata: signal([{ label: 'Chief', value: 'CHIEF' }]),
			projectProfileAssignableRolesLoading: signal(false),
			searchedUsersMetadata: signal([GRACE]),
			inviteByEmailEnabled: signal(false),
			selectedProjectId: (): string => 'p1',
			fetchAssignableRoles: vi.fn(),
			fetchFeatures: vi.fn(),
			searchUsers: vi.fn(),
			createProjectProfiles: vi.fn(() => of({ createdEmails: ['g@x.test'], notCreatedEmails: [] })),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ProjectProfileFacade, useValue: facade },
				{ provide: Location, useValue: { back } },
				{ provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {}, url: [{}] } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal({ name: 'Camp' }), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
				{ provide: DatePipe, useValue: { transform: (): string => '' } },
			],
		});
	});

	it('loads the assignable roles and titles the page after the selected project', async () => {
		// Arrange
		const harness = await create();

		// Act
		const title = await (await harness.form()).title();

		// Assert
		expect([title, calls('fetchAssignableRoles').length]).toEqual(['fr.project-profiles.form.title.create', 1]);
	});

	it('does not invite without a role and users', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.submit();

		// Assert
		expect(calls('createProjectProfiles')).toEqual([]);
	});

	it('invites the chosen users with the chosen role, then goes back', async () => {
		// Arrange
		const harness = await create();
		await fill(harness);

		// Act
		await harness.submit();

		// Assert
		expect([calls('createProjectProfiles'), back.mock.calls.length]).toEqual([
			[[{ role: 'CHIEF', startAccess: undefined, endAccess: undefined, emails: ['g@x.test'] }]],
			1,
		]);
	});

	it('labels the submission after the number of invited users', async () => {
		// Arrange
		const harness = await create();
		await fill(harness);

		// Act
		const label = await (await harness.actions()).submitLabel();

		// Assert
		expect(label).toBe('fr.project-profiles.actions.invite-user.one');
	});

	it('shows the error of a failed invitation and stays on the page', async () => {
		// Arrange
		(facade['createProjectProfiles'] as Mock).mockReturnValue(failing(ERROR_500));
		const harness = await create();
		await fill(harness);

		// Act
		await harness.submit();

		// Assert
		expect([await defined(await (await harness.form()).error()).title(), back.mock.calls]).toEqual([
			'fr.Title',
			[],
		]);
	});

	it('goes back when it is cancelled', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.actions()).cancel();

		// Assert
		expect(back.mock.calls.length).toBe(1);
	});
});
