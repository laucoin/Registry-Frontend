import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe, Location } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component';
import {
	ParticipantFormHarness,
	ParticipantNameEnum,
} from '@pages/projects/[projectId]/configuration/participants/participant-form/testing/participant-form.harness';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { GROUP_DTO, PARTICIPANT_DTO, USER_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { UserHelper } from '@shared/helpers/user.helper';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { UserMapper } from '@shared/mappers/user.mapper';
import { GroupModel } from '@shared/models/model/group.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const LINKED: ParticipantModel = ParticipantMapper.toModel(PARTICIPANT_DTO);
const UNLINKED: ParticipantModel = { ...LINKED, user: undefined };
const GROUP: GroupModel = GroupMapper.toModel(GROUP_DTO);
const USER_ITEM = UserHelper.toSelectItem(UserMapper.toModel(USER_DTO));

describe('ParticipantFormComponent', () => {
	let facade: Record<string, Mock | ReturnType<typeof signal>>;
	let fixture: ComponentFixture<ParticipantFormComponent>;
	let back: Mock<() => void>;

	async function create(id?: string, inputs: Record<string, unknown> = {}): Promise<ParticipantFormHarness> {
		TestBed.overrideProvider(ActivatedRoute, {
			useValue: { snapshot: { params: id ? { participantId: id } : {} } },
		});
		fixture = TestBed.createComponent(ParticipantFormComponent);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ParticipantFormHarness);
	}

	function withBirthday(): void {
		const page = fixture.componentInstance as unknown as { model: { update: (fn: (m: object) => object) => void } };
		page.model.update((model) => ({ ...model, birthday: new Date(2010, 0, 5) }));
	}

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	beforeEach(() => {
		provideTestConfig();
		back = vi.fn();
		facade = {
			fetchParticipant: vi.fn(() => of(UNLINKED)),
			createParticipant: vi.fn(() => of(UNLINKED)),
			updateParticipant: vi.fn(() => of(UNLINKED)),
			searchUsers: vi.fn(),
			searchGroups: vi.fn(),
			searchedUsersMetadata: signal([USER_ITEM]),
			searchedGroupsMetadata: signal([]),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ParticipantFacade, useValue: facade },
				{ provide: Location, useValue: { back } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	describe('as a page', () => {
		it('loads the edited participant, fills the form and updates it with its version, then goes back', async () => {
			// Arrange
			const harness = await create('pa1');
			const first = await harness.name(ParticipantNameEnum.FIRST);

			// Act
			await harness.submit();

			// Assert
			expect([first.value, calls('updateParticipant')[0], back.mock.calls.length]).toEqual([
				'A',
				['pa1', expect.objectContaining({ firstName: 'A', lastName: 'B', userId: undefined }), WHEN_ETAG],
				1,
			]);
		});

		it('does not save an incomplete participant', async () => {
			// Arrange
			const harness = await create();
			await harness.typeName(ParticipantNameEnum.FIRST, 'Ada');

			// Act
			await harness.submit();

			// Assert
			expect(calls('createParticipant')).toEqual([]);
		});

		it('creates the participant from the typed names, then goes back', async () => {
			// Arrange
			const harness = await create();
			await harness.typeName(ParticipantNameEnum.FIRST, 'Ada');
			await harness.typeName(ParticipantNameEnum.LAST, 'Lovelace');
			withBirthday();

			// Act
			await harness.submit();

			// Assert
			expect([calls('createParticipant')[0][0], back.mock.calls.length]).toEqual([
				expect.objectContaining({ firstName: 'Ada', lastName: 'Lovelace', groupIds: [] }),
				1,
			]);
		});

		it('locks the names of a participant linked to a user', async () => {
			// Arrange
			facade['fetchParticipant'] = vi.fn(() => of(LINKED));
			const harness = await create('pa1');

			// Act
			const names = [await harness.name(ParticipantNameEnum.FIRST), await harness.name(ParticipantNameEnum.LAST)];

			// Assert
			expect(names.map((name) => [name.value, name.disabled])).toEqual([
				['Grace', true],
				['H', true],
			]);
		});

		it('takes the names of the chosen user and recalls the replaced ones', async () => {
			// Arrange
			const harness = await create();
			await harness.typeName(ParticipantNameEnum.FIRST, 'Ada');

			// Act
			await defined(await harness.user()).choose('u1');

			// Assert
			expect(await harness.name(ParticipantNameEnum.FIRST)).toEqual({
				value: 'Grace',
				disabled: true,
				hint: 'fr.participants.form.previous-first-name',
			});
		});

		it('restores the replaced names when the user is unlinked', async () => {
			// Arrange
			const harness = await create();
			await harness.typeName(ParticipantNameEnum.FIRST, 'Ada');
			const user = defined(await harness.user());
			await user.choose('u1');

			// Act
			await user.choose('');

			// Assert
			expect(await harness.name(ParticipantNameEnum.FIRST)).toEqual({ value: 'Ada', disabled: false, hint: '' });
		});

		it('searches the groups of the project', async () => {
			// Arrange
			const harness = await create();

			// Act
			await defined(await harness.groups()).search('wolves');

			// Assert
			expect(calls('searchGroups')).toEqual([['wolves']]);
		});

		it('goes back when cancelled', async () => {
			// Arrange
			const harness = await create();

			// Act
			await (await harness.actions()).cancel();

			// Assert
			expect(back).toHaveBeenCalledTimes(1);
		});
	});

	describe('in a group panel', () => {
		it('offers neither the user, nor the period, nor the groups', async () => {
			// Arrange
			const harness = await create(undefined, { redirect: false, defaultGroup: GROUP });

			// Act
			const shown = [
				(await harness.user()) !== null,
				await harness.periodShown(),
				(await harness.groups()) !== null,
			];

			// Assert
			expect(shown).toEqual([false, false, false]);
		});

		it('creates the member in the group without leaving the panel', async () => {
			// Arrange
			const harness = await create(undefined, { redirect: false, defaultGroup: GROUP });
			await harness.typeName(ParticipantNameEnum.FIRST, 'Ada');
			await harness.typeName(ParticipantNameEnum.LAST, 'Lovelace');
			withBirthday();

			// Act
			await harness.submit();

			// Assert
			expect([calls('createParticipant')[0][0], back.mock.calls.length]).toEqual([
				expect.objectContaining({ groupIds: [GROUP.id] }),
				0,
			]);
		});

		it('asks the panel to close when cancelled', async () => {
			// Arrange
			const harness = await create(undefined, { redirect: false, defaultGroup: GROUP });
			let closed = 0;
			fixture.componentInstance.cancelled.subscribe(() => (closed += 1));

			// Act
			await (await harness.actions()).cancel();

			// Assert
			expect([closed, back.mock.calls.length]).toEqual([1, 0]);
		});
	});
});
