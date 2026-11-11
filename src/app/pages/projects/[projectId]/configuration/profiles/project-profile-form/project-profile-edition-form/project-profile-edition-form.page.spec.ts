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
import { ProjectProfileEditionFormPage } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/project-profile-edition-form.page';
import { ProjectProfileEditionFormHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/testing/project-profile-edition-form.harness';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { PROFILE_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, failing, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { ProjectProfileMapper } from '@shared/mappers/project-profile.mapper';

const PROFILE = ProjectProfileMapper.toModel(PROFILE_DTO);
const ROLES = [
	{ label: 'Chief', value: 'CHIEF' },
	{ label: 'Member', value: 'MEMBER' },
];

describe('ProjectProfileEditionFormPage', () => {
	let facade: Record<string, unknown>;
	let navigate: Mock;

	async function create(
		params: Record<string, string> = { profileId: 'pp1' },
	): Promise<ProjectProfileEditionFormHarness> {
		TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { params, url: [{}, {}] } } });
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectProfileEditionFormPage),
			ProjectProfileEditionFormHarness,
		);
	}

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	beforeEach(() => {
		provideTestConfig();
		navigate = vi.fn(() => Promise.resolve(true));
		facade = {
			projectProfileAssignableRolesMetadata: signal(ROLES),
			projectProfileAssignableRolesLoading: signal(false),
			fetchAssignableRoles: vi.fn(),
			fetchProjectProfile: vi.fn(() => of(PROFILE)),
			updateProjectProfile: vi.fn(() => of(PROFILE)),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ProjectProfileFacade, useValue: facade },
				{ provide: Location, useValue: { back: vi.fn() } },
				{ provide: Router, useValue: { navigate, navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {}, url: [{}] } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
				{ provide: DatePipe, useValue: { transform: (): string => '' } },
			],
		});
	});

	it('loads the roles and the profile, then shows its user and fills its role', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.roles(), await harness.role(), (await defined(await harness.user()).view()).name];

		// Assert
		expect([shown, calls('fetchAssignableRoles').length, calls('fetchProjectProfile')]).toEqual([
			[['Chief', 'Member'], 'CHIEF', 'Grace H'],
			1,
			[['pp1']],
		]);
	});

	it('updates the profile with the chosen role and its version, then closes on the list', async () => {
		// Arrange
		const harness = await create();
		await harness.chooseRole('MEMBER');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([calls('updateProjectProfile'), navigate.mock.calls[0][0]]).toEqual([
			[['pp1', { role: 'MEMBER', startAccess: undefined, endAccess: undefined }, WHEN_ETAG]],
			['../..'],
		]);
	});

	it('does not save a profile without a role', async () => {
		// Arrange
		const harness = await create();
		await harness.chooseRole('');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect(calls('updateProjectProfile')).toEqual([]);
	});

	it('neither loads nor saves a profile when the route names none', async () => {
		// Arrange
		const harness = await create({});

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([await harness.user(), calls('fetchProjectProfile'), calls('updateProjectProfile')]).toEqual([
			null,
			[],
			[],
		]);
	});

	it('shows the error of a failed save and stays on the dialog', async () => {
		// Arrange
		(facade['updateProjectProfile'] as Mock).mockReturnValue(failing(ERROR_500));
		const harness = await create();

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([await defined(await (await harness.dialog()).error()).title(), navigate.mock.calls]).toEqual([
			'fr.Title',
			[],
		]);
	});

	it('closes on the list when it is cancelled', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.dialog()).cancel();

		// Assert
		expect(navigate.mock.calls[0][0]).toEqual(['../..']);
	});
});
