import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldTree } from '@angular/forms/signals';

import { describe, expect, it } from 'vitest';

import {
	createRegisteredMovementForm,
	driversOf,
	emptyRegisteredMovementFormModel,
	RegisteredMovementFormModel,
	toRegisteredMovementDto,
	toRegisteredMovementFormModel,
	withRegisteredType,
} from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement.form';
import { MovementFormContext } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { defined } from '@shared/helpers/testing/defined';
import { MOVEMENT_DTO, PARTICIPANT_DTO, VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

const NOW = new Date(2026, 5, 15, 10);

function adult(id = 'pa1'): ParticipantModel {
	return structuredClone({ ...PARTICIPANT_DTO, id, major: true }) as unknown as ParticipantModel;
}

function kindsOf(field: { errors: () => readonly { kind: string }[] }): string[] {
	return field.errors().map((error) => error.kind);
}

describe('registered movement form', () => {
	function build(
		initial: RegisteredMovementFormModel,
		editing = false,
		project?: ProjectModel,
	): FieldTree<RegisteredMovementFormModel> {
		const context: MovementFormContext = {
			project: () => project,
			formatDate: (date: CustomDatetimeModel): string => defined(date.date),
			editing: () => editing,
		};
		const model = signal(initial);
		return TestBed.runInInjectionContext(() => createRegisteredMovementForm(model, context));
	}

	it('requires the type and at least one participant', () => {
		// Arrange
		const tree = build(emptyRegisteredMovementFormModel(NOW));

		// Act
		const kinds = [kindsOf(tree.information.type()), kindsOf(tree.content.participants())];

		// Assert
		expect(kinds).toEqual([['required'], ['required']]);
	});

	it('requires a reason for a departure only', () => {
		// Arrange
		const base = emptyRegisteredMovementFormModel(NOW);
		const departure = build(withRegisteredType(base, MovementTypeEnum.OUT));
		const arrival = build(withRegisteredType(base, MovementTypeEnum.IN));

		// Act
		const kinds = [kindsOf(departure.content.reason()), kindsOf(arrival.content.reason())];

		// Assert
		expect(kinds).toEqual([['required'], []]);
	});

	it('requires a driver for each vehicle', () => {
		// Arrange
		const model: RegisteredMovementFormModel = {
			...emptyRegisteredMovementFormModel(NOW),
			vehicles: [{ vehicle: structuredClone(VEHICLE_DTO) as unknown as VehicleModel, driver: null }],
		};
		const tree = build(model);

		// Act
		const kinds = kindsOf(tree.vehicles[0].driver());

		// Assert
		expect(kinds).toEqual(['required']);
	});

	it('locks the type while editing and keeps the date inside the project', () => {
		// Arrange
		const project = { begin: { date: '2026-07-01', time: '00:00:00' } } as ProjectModel;
		const tree = build(emptyRegisteredMovementFormModel(NOW), true, project);

		// Act
		const results: unknown[] = [tree.information.type().disabled(), kindsOf(tree.information.dateTime())];

		// Assert
		expect(results).toEqual([true, ['minDate']]);
	});

	it('clears the reason when the type changes', () => {
		// Arrange
		const withReason: RegisteredMovementFormModel = {
			...emptyRegisteredMovementFormModel(NOW),
			content: { reason: { kind: 'REASON', value: 'r', label: 'r' }, participants: [] },
		};

		// Act
		const changed = withRegisteredType(withReason, MovementTypeEnum.OUT);

		// Assert
		expect([changed.information.type, changed.content.reason]).toEqual([MovementTypeEnum.OUT, null]);
	});

	it('rebuilds a movement with its participants, reason and vehicles', () => {
		// Arrange
		const movement = structuredClone(MOVEMENT_DTO) as unknown as MovementModel;

		// Act
		const model = toRegisteredMovementFormModel(movement);

		// Assert
		expect(model.information).toEqual({ dateTime: new Date(movement.dateTime), type: 'IN' });
		expect(model.content.participants).toHaveLength(1);
		expect(model.content.reason).toEqual(movement.reason);
		expect(model.vehicles.map((item) => item.driver?.id)).toEqual(['pa1']);
	});

	it('rebuilds a movement without reason', () => {
		// Arrange
		const movement = {
			...structuredClone(MOVEMENT_DTO),
			reason: undefined,
		} as unknown as MovementModel;

		// Act
		const model = toRegisteredMovementFormModel(movement);

		// Assert
		expect(model.content.reason).toBeNull();
	});

	it('sends the reason as an activity and attaches to each participant the vehicle he or she drives', () => {
		// Arrange
		const driver = adult();
		const model: RegisteredMovementFormModel = {
			information: { dateTime: NOW, type: MovementTypeEnum.OUT },
			content: {
				reason: { kind: 'ACTIVITY', value: 'a1', label: '' },
				participants: [{ participant: driver, poolName: 'car 1' } as MovementContentModel],
			},
			vehicles: [{ vehicle: { id: 'v9' } as VehicleModel, driver }],
		};

		// Act
		const dto = toRegisteredMovementDto(model);

		// Assert
		expect(dto).toEqual({
			dateTime: NOW,
			type: 'OUT',
			reason: undefined,
			activityId: 'a1',
			content: [{ poolName: 'car 1', participantId: 'pa1', vehicleId: 'v9' }],
		});
	});

	it('only offers the adult participants as drivers', () => {
		// Arrange
		const model = emptyRegisteredMovementFormModel(NOW);
		model.content.participants = [
			{ participant: adult('a') } as MovementContentModel,
			{ participant: { ...adult('b'), major: false } } as MovementContentModel,
		];

		// Act
		const drivers = driversOf(model).map((driver) => driver.value.id);

		// Assert
		expect(drivers).toEqual(['a']);
	});
});
