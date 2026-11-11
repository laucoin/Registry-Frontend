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
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { GroupFormPage } from '@pages/projects/[projectId]/configuration/groups/group-form/group-form.page';
import { GroupFormHarness } from '@pages/projects/[projectId]/configuration/groups/group-form/testing/group-form.harness';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { GROUP_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, failing, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { ParticipantModel } from '@shared/models/model/participant.model';

const GROUP = GroupMapper.toModel(GROUP_DTO);
const MEMBER = { id: 'pa1', firstName: 'Ada', lastName: 'Lovelace' } as ParticipantModel;

describe('GroupFormPage', () => {
	let facade: Record<string, unknown>;
	let back: Mock;

	async function create(id?: string): Promise<GroupFormHarness> {
		TestBed.overrideProvider(ActivatedRoute, {
			useValue: { snapshot: { params: id ? { groupId: id } : {}, url: id ? [{}, {}] : [{}] } },
		});
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(GroupFormPage), GroupFormHarness);
	}

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	async function createGroup(): Promise<GroupFormHarness> {
		const harness = await create();
		await harness.typeName('Wolves');
		await harness.submit();
		return harness;
	}

	beforeEach(() => {
		provideTestConfig();
		back = vi.fn();
		facade = {
			searchedParticipantsMetadata: signal([{ label: 'Ada', value: MEMBER }]),
			searchParticipants: vi.fn(),
			fetchGroup: vi.fn(() => of(GROUP)),
			createGroup: vi.fn(() => of(GROUP)),
			updateGroup: vi.fn(() => of(GROUP)),
			addMembersToGroup: vi.fn(() => of({ members: [MEMBER], notAddedMemberIds: [] })),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: GroupFacade, useValue: facade },
				{ provide: Location, useValue: { back } },
				{ provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
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

	describe('the creation', () => {
		it('starts on the information step of the stepper', async () => {
			// Arrange
			const harness = await create();

			// Act
			const step = await harness.activeStep();

			// Assert
			expect([step, await (await harness.form()).title(), calls('fetchGroup')]).toEqual([
				'step-1',
				'fr.groups.form.title.create',
				[],
			]);
		});

		it('does not create a group without a name', async () => {
			// Arrange
			const harness = await create();

			// Act
			await harness.submit();

			// Assert
			expect([calls('createGroup'), await harness.activeStep()]).toEqual([[], 'step-1']);
		});

		it('creates the group, then stays on the page for the members step', async () => {
			// Arrange
			const harness = await create();
			await harness.typeName('Wolves');

			// Act
			await harness.submit();

			// Assert
			expect([
				calls('createGroup'),
				await harness.activeStep(),
				await harness.createdTitle(),
				back.mock.calls.length,
			]).toEqual([
				[[{ name: 'Wolves', startAvailability: undefined, endAvailability: undefined }]],
				'step-2',
				'fr.groups.form.members-step.created.title',
				0,
			]);
		});

		it('shows the error of a failed creation and stays on the information step', async () => {
			// Arrange
			(facade['createGroup'] as Mock).mockReturnValue(failing(ERROR_500));

			// Act
			const harness = await createGroup();

			// Assert
			expect([await defined(await (await harness.form()).error()).title(), await harness.activeStep()]).toEqual([
				'fr.Title',
				'step-1',
			]);
		});
	});

	describe('the members step', () => {
		it('searches the participants to add', async () => {
			// Arrange
			const harness = await createGroup();

			// Act
			await (await (await defined(await harness.members())).selection()).search('ada');

			// Assert
			expect(calls('searchParticipants')).toEqual([['ada']]);
		});

		it('adds the chosen members to the created group, then goes back', async () => {
			// Arrange
			const harness = await createGroup();
			await (await (await defined(await harness.members())).selection()).choose('pa1');

			// Act
			await harness.addMembers();

			// Assert
			expect([calls('addMembersToGroup'), back.mock.calls.length]).toEqual([[['g1', ['pa1']]], 1]);
		});

		it('adds nothing when no member is chosen', async () => {
			// Arrange
			const harness = await createGroup();

			// Act
			await harness.addMembers();

			// Assert
			expect([calls('addMembersToGroup'), back.mock.calls.length]).toEqual([[], 0]);
		});

		it('shows the error of a failed addition and stays on the members step', async () => {
			// Arrange
			(facade['addMembersToGroup'] as Mock).mockReturnValue(failing(ERROR_500));
			const harness = await createGroup();
			await (await (await defined(await harness.members())).selection()).choose('pa1');

			// Act
			await harness.addMembers();

			// Assert
			expect([await defined(await (await harness.form()).error()).title(), await harness.activeStep()]).toEqual([
				'fr.Title',
				'step-2',
			]);
		});

		it('goes back when it is skipped', async () => {
			// Arrange
			const harness = await createGroup();

			// Act
			await harness.skip();

			// Assert
			expect([calls('addMembersToGroup'), back.mock.calls.length]).toEqual([[], 1]);
		});
	});

	describe('the edition', () => {
		it('loads the group, fills its name and shows no stepper', async () => {
			// Arrange
			const harness = await create('g1');

			// Act
			const shown = [await harness.name(), await harness.activeStep(), await (await harness.form()).title()];

			// Assert
			expect([shown, calls('fetchGroup')]).toEqual([
				['Wolves', undefined, 'fr.groups.form.title.edit'],
				[['g1']],
			]);
		});

		it('updates the group with its version, then goes back', async () => {
			// Arrange
			const harness = await create('g1');
			await harness.typeName('Bears');

			// Act
			await harness.submit();

			// Assert
			expect([calls('updateGroup'), calls('createGroup'), back.mock.calls.length]).toEqual([
				[['g1', { name: 'Bears', startAvailability: undefined, endAvailability: undefined }, WHEN_ETAG]],
				[],
				1,
			]);
		});

		it('labels its submission as an edition', async () => {
			// Arrange
			const harness = await create('g1');

			// Act
			const label = await defined(await harness.actions()).submitLabel();

			// Assert
			expect(label).toBe('fr.global.actions.edit');
		});
	});

	it('goes back when it is cancelled', async () => {
		// Arrange
		const harness = await create();

		// Act
		await defined(await harness.actions()).cancel();

		// Assert
		expect(back.mock.calls.length).toBe(1);
	});
});
