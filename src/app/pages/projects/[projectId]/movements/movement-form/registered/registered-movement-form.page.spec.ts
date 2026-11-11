import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe, Location } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { RegisteredMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement-form.page';
import {
	RegisteredMovementFormHarness,
	RegisteredStepEnum,
} from '@pages/projects/[projectId]/movements/movement-form/registered/testing/registered-movement-form.harness';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { MovementReasonKindEnum } from '@shared/models/enumeration/movement-reason-kind.enum';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPrefillModel } from '@shared/models/model/movement-prefill.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { movementOf, person } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

const REASON: MovementReasonModel = { kind: MovementReasonKindEnum.ACTIVITY, value: 'a1', label: 'Hike' };
const ADA = person('ada', true);
const BOB = person('bob', false);
const VAN = {
	id: 'v1',
	brand: 'Renault',
	model: 'Trafic',
	licensePlate: 'V1',
	status: { value: PresenceStatusEnum.OUT, label: 'Out' },
} as VehicleModel;

describe('RegisteredMovementFormPage', () => {
	let facade: Record<string, Mock>;
	let back: Mock<() => void>;
	let vehicleOption: WritableSignal<boolean>;
	let prefill: MovementPrefillModel | undefined;

	async function create(id?: string): Promise<RegisteredMovementFormHarness> {
		TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { params: id ? { movementId: id } : {} } } });
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(RegisteredMovementFormPage),
			RegisteredMovementFormHarness,
		);
	}

	async function toContent(type: string): Promise<RegisteredMovementFormHarness> {
		const harness = await create();
		const information = defined(await harness.information());
		await information.chooseType(type);
		await information.next();
		return harness;
	}

	async function chooseAdaAndBob(harness: RegisteredMovementFormHarness): Promise<void> {
		const field = await defined(await harness.participants()).field();
		await field.choose('ada');
		await field.choose('bob');
	}

	const calls = (name: string): unknown[][] => facade[name].mock.calls;

	beforeEach(() => {
		back = vi.fn();
		vehicleOption = signal(false);
		prefill = undefined;
		facade = Object.assign(autoMock(undefined), {
			movementTypesMetadata: signal([
				{ label: 'In', value: 'IN' },
				{ label: 'Out', value: 'OUT' },
			]),
			searchedReasonAndActivityMetadata: signal([REASON]),
			searchedParticipantAndGroupMetadata: signal([
				{
					label: 'Participants',
					items: [
						{ label: 'Ada', value: ADA.participant },
						{ label: 'Bob', value: BOB.participant },
					],
				},
			]),
			searchedVehicleMetadata: signal([{ label: 'Van', value: VAN }]),
			fetchMovement: vi.fn(() => of(movementOf({ id: 'm1' }))),
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
					useValue: {
						selectedProject: signal(undefined),
						currentUser: signal(undefined),
						selectedProjectHasOption: (): WritableSignal<boolean> => vehicleOption,
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	describe('steps', () => {
		it.each([
			{ name: 'two steps without the vehicle option', option: false, id: undefined, steps: 2 },
			{ name: 'the vehicle step with the vehicle option', option: true, id: undefined, steps: 3 },
			{ name: 'the vehicle step for an edited movement with vehicles', option: false, id: 'm1', steps: 3 },
		])('offers $name', async ({ option, id, steps }) => {
			// Arrange
			vehicleOption.set(option);
			const harness = await create(id);

			// Act
			const shown = await harness.steps();

			// Assert
			expect(shown).toHaveLength(steps);
		});

		it.each([
			{ name: 'asks for a reason for a departure', type: 'OUT', reason: true },
			{ name: 'asks no reason for an arrival', type: 'IN', reason: false },
		])('$name', async ({ type, reason }) => {
			// Arrange
			const harness = await toContent(type);

			// Act
			const shown = (await harness.reason()) !== null;

			// Assert
			expect([await harness.activeStep(), shown]).toEqual(['step-2', reason]);
		});

		it('forgets the chosen reason when the type changes', async () => {
			// Arrange
			const harness = await toContent('OUT');
			await defined(await harness.reason()).choose('ACTIVITY:a1');
			await harness.previous(RegisteredStepEnum.CONTENT);
			const information = defined(await harness.information());

			// Act
			await information.chooseType('IN');
			await information.chooseType('OUT');
			await information.next();

			// Assert
			expect(await defined(await harness.reason()).value()).toBe('');
		});

		it('stays on the content step while no participant is chosen', async () => {
			// Arrange
			const harness = await toContent('IN');

			// Act
			await harness.submit(RegisteredStepEnum.CONTENT);

			// Assert
			expect([await harness.activeStep(), calls('createRegisteredMovement')]).toEqual(['step-2', []]);
		});
	});

	describe('saving', () => {
		it('creates the movement from the content step when there is no vehicle step, and goes back', async () => {
			// Arrange
			const harness = await toContent('IN');
			await chooseAdaAndBob(harness);
			const label = await harness.contentSubmitText();

			// Act
			await harness.submit(RegisteredStepEnum.CONTENT);

			// Assert
			expect([label, calls('createRegisteredMovement')[0][0], back.mock.calls.length]).toEqual([
				'fr.global.actions.create',
				{
					dateTime: expect.any(Date),
					type: 'IN',
					reason: undefined,
					activityId: undefined,
					content: [
						{ poolName: undefined, participantId: 'ada', vehicleId: undefined },
						{ poolName: undefined, participantId: 'bob', vehicleId: undefined },
					],
				},
				1,
			]);
		});

		it('goes to the vehicle step with the adults as drivers, then back', async () => {
			// Arrange
			vehicleOption.set(true);
			const harness = await toContent('IN');
			await chooseAdaAndBob(harness);
			const label = await harness.contentSubmitText();
			await harness.submit(RegisteredStepEnum.CONTENT);
			const vehicles = defined(await harness.vehicles());
			await vehicles.choose('v1');
			const drivers = (await vehicles.vehicles())[0].drivers;

			// Act
			await harness.previous(RegisteredStepEnum.VEHICLES);

			// Assert
			expect([label, drivers, await harness.activeStep()]).toEqual([
				'fr.global.actions.next',
				['ada adason'],
				'step-2',
			]);
		});

		it.each([
			{ name: 'does not save a vehicle without a driver', driver: undefined, saved: [] },
			{
				name: 'saves the vehicle with its driver',
				driver: 'ada',
				saved: [
					[
						expect.objectContaining({
							content: [
								{ poolName: undefined, participantId: 'ada', vehicleId: 'v1' },
								{ poolName: undefined, participantId: 'bob', vehicleId: undefined },
							],
						}),
					],
				],
			},
		])('$name', async ({ driver, saved }) => {
			// Arrange
			vehicleOption.set(true);
			const harness = await toContent('IN');
			await chooseAdaAndBob(harness);
			await harness.submit(RegisteredStepEnum.CONTENT);
			const vehicles = defined(await harness.vehicles());
			await vehicles.choose('v1');
			if (driver) await vehicles.chooseDriver(0, driver);

			// Act
			await harness.submit(RegisteredStepEnum.VEHICLES);

			// Assert
			expect(calls('createRegisteredMovement')).toEqual(saved);
		});
	});

	describe('prefill and editing', () => {
		it('starts on the content step with the prefilled participants and reason', async () => {
			// Arrange
			prefill = { type: MovementTypeEnum.OUT, reason: REASON, content: [ADA] };
			const harness = await create();

			// Act
			const field = await defined(await harness.participants()).field();

			// Assert
			expect([
				await harness.activeStep(),
				(await field.selection()).map((row) => row.value),
				await defined(await harness.reason()).value(),
			]).toEqual(['step-2', ['ada'], 'ACTIVITY:a1']);
		});

		it('loads the edited movement with its vehicle and driver, locks its type and updates it with its version', async () => {
			// Arrange
			const edited: MovementModel = movementOf({
				id: 'm1',
				content: [{ ...ADA, vehicle: VAN }],
				lastEdition: { dateTime: new Date('2026-01-02T00:00:00Z'), user: undefined },
			});
			facade['fetchMovement'].mockReturnValue(of(edited));
			const harness = await create('m1');
			const information = defined(await harness.information());
			const locked = await information.typeDisabled();
			await information.next();
			await harness.submit(RegisteredStepEnum.CONTENT);

			// Act
			await harness.submit(RegisteredStepEnum.VEHICLES);

			// Assert
			expect([locked, calls('updateRegisteredMovement')[0][0], calls('updateRegisteredMovement')[0][2]]).toEqual([
				true,
				'm1',
				`"${new Date('2026-01-02T00:00:00Z').getTime()}"`,
			]);
		});
	});
});
