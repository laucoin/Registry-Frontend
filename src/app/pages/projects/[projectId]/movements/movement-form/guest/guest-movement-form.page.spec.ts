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
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { GuestMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement-form.page';
import { GuestMovementFormHarness } from '@pages/projects/[projectId]/movements/movement-form/guest/testing/guest-movement-form.harness';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { MovementReasonKindEnum } from '@shared/models/enumeration/movement-reason-kind.enum';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { MovementPrefillModel } from '@shared/models/model/movement-prefill.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { movementOf, person } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

const REASON: MovementReasonModel = { kind: MovementReasonKindEnum.REASON, value: 'r1', label: 'Visit' };
const GUEST = person('ada', true);

describe('GuestMovementFormPage', () => {
	let facade: Record<string, Mock>;
	let back: Mock<() => void>;
	let prefill: MovementPrefillModel | undefined;
	let fixture: ComponentFixture<GuestMovementFormPage>;

	async function create(id?: string): Promise<GuestMovementFormHarness> {
		TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { params: id ? { movementId: id } : {} } } });
		fixture = TestBed.createComponent(GuestMovementFormPage);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, GuestMovementFormHarness);
	}

	const calls = (name: string): unknown[][] => facade[name].mock.calls;

	beforeEach(() => {
		back = vi.fn();
		prefill = undefined;
		facade = Object.assign(autoMock(undefined), {
			movementTypesMetadata: signal([
				{ label: '-', value: undefined },
				{ label: 'In', value: 'IN' },
				{ label: 'Out', value: 'OUT' },
			]),
			searchedReasonAndActivityMetadata: signal([REASON]),
			searchedParticipantAndGroupMetadata: signal([
				{ label: 'Groups', items: [{ label: 'Scouts', value: { id: 'g1', name: 'Scouts', members: [] } }] },
				{ label: 'Guests', items: [{ label: 'Ada', value: GUEST.participant }] },
			]),
			fetchMovement: vi.fn(() => of(movementOf({ id: 'm1', type: { value: MovementTypeEnum.IN, label: 'In' } }))),
		}) as unknown as Record<string, Mock>;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: MovementFacade, useValue: facade },
				{
					provide: MovementPrefillService,
					useValue: { read: (): MovementPrefillModel | undefined => prefill },
				},
				{ provide: Location, useValue: { back } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	describe('steps', () => {
		it('starts a new movement on the information step', async () => {
			// Arrange
			const harness = await create();

			// Act
			const shown = [await harness.activeStep(), await (await harness.form()).title()];

			// Assert
			expect(shown).toEqual(['step-1', 'fr.movements.form.title.create.none']);
		});

		it('stays on the information step until a type is chosen', async () => {
			// Arrange
			const harness = await create();

			// Act
			await defined(await harness.information()).next();

			// Assert
			expect(await harness.activeStep()).toBe('step-1');
		});

		it('stays on the information step when the date is before the project', async () => {
			// Arrange
			TestBed.overrideProvider(SessionFacade, {
				useValue: {
					selectedProject: signal({ begin: { date: '2999-01-01', time: '00:00:00' } }),
					currentUser: signal(undefined),
				},
			});
			const harness = await create();
			const information = defined(await harness.information());
			await information.chooseType('IN');

			// Act
			await information.next();

			// Assert
			expect(await harness.activeStep()).toBe('step-1');
		});

		it('asks for a reason and one guest for an arrival', async () => {
			// Arrange
			const harness = await create();
			const information = defined(await harness.information());

			// Act
			await information.chooseType('IN');
			await information.next();

			// Assert
			expect([
				await harness.activeStep(),
				(await harness.reason()) !== null,
				(await defined(await harness.guests()).guests()).length,
				await harness.participants(),
			]).toEqual(['step-2', true, 1, null]);
		});

		it('goes back to the information step, and leaves the form on cancel', async () => {
			// Arrange
			const harness = await create();
			const information = defined(await harness.information());
			await information.chooseType('OUT');
			await information.next();

			// Act
			await harness.previous();
			await defined(await harness.information()).cancel();

			// Assert
			expect([await harness.activeStep(), back.mock.calls.length]).toEqual(['step-1', 1]);
		});
	});

	describe('departure', () => {
		async function departure(): Promise<GuestMovementFormHarness> {
			const harness = await create();
			const information = defined(await harness.information());
			await information.chooseType('OUT');
			await information.next();
			return harness;
		}

		it('searches the guests present at the movement date', async () => {
			// Arrange
			const harness = await departure();

			// Act
			await defined(await harness.participants()).search('ada');

			// Assert
			expect(calls('searchParticipantsAndGroups').at(-1)).toEqual([
				ParticipantTypeEnum.GUEST,
				'ada',
				expect.any(Date),
			]);
		});

		it('offers the guests alone and leaves their groups out', async () => {
			// Arrange
			const harness = await departure();
			const participants = defined(await harness.participants());

			// Act
			await participants.choose('g1');
			await participants.choose('ada');

			// Assert
			expect((await participants.selection()).map((row) => row.value)).toEqual(['ada']);
		});

		it('creates the departure of the chosen guests and goes back', async () => {
			// Arrange
			const harness = await departure();
			await defined(await harness.participants()).choose('ada');

			// Act
			await harness.save();

			// Assert
			expect([calls('createGuestMovement')[0][0], back.mock.calls.length]).toEqual([
				{
					dateTime: expect.any(Date),
					type: 'OUT',
					reason: undefined,
					content: [{ participantId: 'ada' }],
					guests: [],
				},
				1,
			]);
		});

		it('does not save a departure without any guest', async () => {
			// Arrange
			const harness = await departure();

			// Act
			await harness.save();

			// Assert
			expect(calls('createGuestMovement')).toEqual([]);
		});
	});

	describe('prefill and editing', () => {
		it('starts on the content step with the guests of a prefilled arrival, and creates it', async () => {
			// Arrange
			prefill = {
				type: MovementTypeEnum.IN,
				reason: REASON,
				content: [person('ada', true)].map((content) => ({
					...content,
					participant: { ...content.participant, id: '', birthday: '2010-01-05' },
				})),
			};
			const harness = await create();

			// Act
			await harness.save();

			// Assert
			expect([await harness.activeStep(), calls('createGuestMovement')[0][0]]).toEqual([
				'step-2',
				{
					dateTime: expect.any(Date),
					type: 'IN',
					reason: 'r1',
					content: [],
					guests: [{ id: undefined, firstName: 'ada', lastName: 'adason', birthday: expect.anything() }],
				},
			]);
		});

		it('loads the edited departure, locks its type and updates it', async () => {
			// Arrange
			facade['fetchMovement'].mockReturnValue(
				of(movementOf({ id: 'm1', type: { value: MovementTypeEnum.OUT, label: 'Out' }, content: [GUEST] })),
			);
			const harness = await create('m1');
			const information = defined(await harness.information());
			const locked = await information.typeDisabled();

			// Act
			await information.next();
			await harness.save();

			// Assert
			expect([locked, calls('fetchMovement')[0], calls('updateGuestMovement')[0]]).toEqual([
				true,
				['m1'],
				[
					'm1',
					{
						dateTime: expect.any(Date),
						type: 'OUT',
						reason: undefined,
						content: [{ participantId: 'ada' }],
						guests: [],
					},
					undefined,
				],
			]);
		});
	});
});
