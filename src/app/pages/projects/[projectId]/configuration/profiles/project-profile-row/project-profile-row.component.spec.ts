import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfileRowComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-row.component';
import {
	InvitationAnswerEnum,
	ProjectProfileRowHarness,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/testing/project-profile-row.harness';
import { defined } from '@shared/helpers/testing/defined';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { ListedProfileModel } from '@shared/models/model/listed-profile.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';

const PROFILE = {
	id: 'pp1',
	visible: true,
	user: { id: 'u2', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' },
	projectId: 'p1',
	role: { value: 'ADMIN', label: 'Administrator' },
	status: { value: ProfileStatusEnum.ACCEPTED, label: 'Accepted' },
	availabilityStatus: { value: AvailabilityStatusEnum.AVAILABLE, label: 'Available' },
	startAccess: { date: '2026-07-01', time: undefined },
	endAccess: undefined,
} as unknown as ProjectProfileModel;

const INVITATION = {
	id: 'pp2',
	visible: true,
	project: { id: 'p1', name: 'Camp Vercors', favorite: true },
	role: { value: 'ADMIN', label: 'Administrator' },
	status: { value: ProfileStatusEnum.ACCEPTED, label: 'Accepted' },
	availabilityStatus: undefined,
	startAccess: undefined,
	endAccess: undefined,
} as unknown as UserInvitationModel;

@Component({
	imports: [ProjectProfileRowComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-profile-row.component.spec.html',
})
class HostComponent {
	public readonly profile: WritableSignal<ListedProfileModel> = signal(PROFILE);
}

describe('ProjectProfileRowComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let selectedProject: WritableSignal<{ id: string } | undefined>;
	let toggleProjectFavorite: Mock;
	let manageProjectInvitationAcceptance: Mock;
	let confirm: Mock;

	async function create(profile: ListedProfileModel): Promise<ProjectProfileRowHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.profile.set(profile);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ProjectProfileRowHarness);
	}

	beforeEach(() => {
		selectedProject = signal(undefined);
		toggleProjectFavorite = vi.fn();
		manageProjectInvitationAcceptance = vi.fn();
		confirm = vi.fn();
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ProjectProfileFacade, useValue: {} },
				{ provide: UserProfileFacade, useValue: { toggleProjectFavorite, manageProjectInvitationAcceptance } },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: [] }),
						selectedProject,
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm, tinyScreen: signal(false) } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: DatePipe, useValue: { transform: (): string => '01/07' } },
			],
		});
	});

	it.each([
		{
			name: 'titles a profile seen from the project with the person, its access and its tags',
			profile: PROFILE,
			expected: {
				title: 'Ada LOVELACE',
				initials: 'AL',
				description: '01/07...',
				tags: ['Administrator', 'Available', 'Accepted'],
			},
		},
		{
			name: 'titles a profile seen from the user with the project',
			profile: INVITATION,
			expected: { title: 'Camp Vercors', initials: 'CV', description: '', tags: ['Administrator', 'Accepted'] },
		},
		{
			name: 'falls back on the email of a person without a name',
			profile: { ...PROFILE, user: { id: 'u2', email: 'ada@example.org' } } as ProjectProfileModel,
			expected: {
				title: 'ada@example.org',
				initials: 'AD',
				description: '01/07...',
				tags: ['Administrator', 'Available', 'Accepted'],
			},
		},
	])('$name', async ({ profile, expected }) => {
		// Arrange
		const harness = await create(profile);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual({ ...expected, disabled: false });
	});

	it('greys out a blocked profile and tags it', async () => {
		// Arrange
		const harness = await create({ ...PROFILE, visible: false });

		// Act
		const view = await harness.view();

		// Assert
		expect([view.disabled, view.tags]).toEqual([
			true,
			['Administrator', 'fr.project-profiles.blocked', 'Available', 'Accepted'],
		]);
	});

	it.each([
		{ name: 'the profile of the selected project in success', selected: { id: 'p1' }, variant: 'success' },
		{ name: 'another profile as primary', selected: undefined, variant: 'primary' },
	])('colours the avatar of $name', async ({ selected, variant }) => {
		// Arrange
		selectedProject.set(selected);
		const harness = await create(PROFILE);

		// Act
		const shown = await harness.avatarVariant();

		// Assert
		expect(shown).toBe(variant);
	});

	it.each([
		{ name: 'an accepted profile in success', status: ProfileStatusEnum.ACCEPTED, variant: 'success' },
		{ name: 'a rejected profile as a warning', status: ProfileStatusEnum.REJECTED, variant: 'warning' },
		{ name: 'a blocked profile as a danger', status: ProfileStatusEnum.BLOCKED, variant: 'danger' },
		{ name: 'the invitation of somebody else as information', status: ProfileStatusEnum.INVITED, variant: 'info' },
	])('colours $name', async ({ status, variant }) => {
		// Arrange
		const harness = await create({ ...PROFILE, status: { value: status, label: status } } as ProjectProfileModel);

		// Act
		const shown = await harness.statusVariant();

		// Assert
		expect(shown).toBe(variant);
	});

	it('toggles the favorite of the project of a profile seen from the user', async () => {
		// Arrange
		const harness = await create(INVITATION);
		const favorite = defined(await harness.favorite());

		// Act
		await favorite.toggle();

		// Assert
		expect([await favorite.pressed(), toggleProjectFavorite.mock.calls]).toEqual(['true', [[INVITATION]]]);
	});

	it.each([
		{ name: 'from the project side', profile: PROFILE },
		{
			name: 'while the invitation awaits an answer',
			profile: {
				...INVITATION,
				status: { value: ProfileStatusEnum.INVITED, label: 'Invited' },
			} as UserInvitationModel,
		},
	])('offers no favorite $name', async ({ profile }) => {
		// Arrange
		const harness = await create(profile);

		// Act
		const favorite = await harness.favorite();

		// Assert
		expect(favorite).toBeNull();
	});

	it.each([
		{ name: 'accepts', answer: InvitationAnswerEnum.ACCEPT, accepted: true },
		{ name: 'rejects', answer: InvitationAnswerEnum.REJECT, accepted: false },
	])('$name an invitation of the user once confirmed', async ({ answer, accepted }) => {
		// Arrange
		const invited = {
			...PROFILE,
			user: { ...PROFILE.user, id: 'u1' },
			status: { value: ProfileStatusEnum.INVITED, label: 'Invited' },
		} as ProjectProfileModel;
		const harness = await create(invited);
		const answers = await harness.answers();

		// Act
		await harness.answer(answer);
		confirm.mock.calls[0][0].accept();

		// Assert
		expect([answers, manageProjectInvitationAcceptance.mock.calls]).toEqual([
			['project-profile-row-reject-button', 'project-profile-row-accept-button'],
			[['pp1', accepted]],
		]);
	});

	it('offers no answer to an invitation of somebody else', async () => {
		// Arrange
		const harness = await create({
			...PROFILE,
			status: { value: ProfileStatusEnum.INVITED, label: 'Invited' },
		} as ProjectProfileModel);

		// Act
		const answers = await harness.answers();

		// Assert
		expect(answers).toEqual([]);
	});

	it('titles a profile seen from the user without its project with nothing', async () => {
		// Arrange
		const harness = await create({ ...INVITATION, project: undefined } as unknown as UserInvitationModel);

		// Act
		const view = await harness.view();

		// Assert
		expect(view.title).toBe('');
	});
});
