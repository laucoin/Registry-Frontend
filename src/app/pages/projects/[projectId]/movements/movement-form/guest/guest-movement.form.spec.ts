import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldTree } from '@angular/forms/signals';

import { describe, expect, it } from 'vitest';

import {
	createGuestMovementForm,
	emptyGuest,
	emptyGuestMovementFormModel,
	GuestMovementFormModel,
	isArrival,
	toGuestMovementDto,
	toGuestMovementFormModel,
	withGuestType,
} from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement.form';
import { MovementFormContext } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { defined } from '@shared/helpers/testing/defined';
import { MOVEMENT_DTO, PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const NOW = new Date(2026, 5, 15, 10);

function kindsOf(field: { errors: () => readonly { kind: string }[] }): string[] {
	return field.errors().map((error) => error.kind);
}

function modelOf(type: string): GuestMovementFormModel {
	return withGuestType(emptyGuestMovementFormModel(NOW), type);
}

describe('guest movement form', () => {
	function build(initial: GuestMovementFormModel): FieldTree<GuestMovementFormModel> {
		const context: MovementFormContext = {
			project: () => undefined,
			formatDate: (date: CustomDatetimeModel): string => defined(date.date),
			editing: () => false,
		};
		const model = signal(initial);
		return TestBed.runInInjectionContext(() => createGuestMovementForm(model, context));
	}

	it('tells an arrival from a departure', () => {
		// Arrange
		const arrival = modelOf(MovementTypeEnum.IN);
		const departure = modelOf(MovementTypeEnum.OUT);

		// Act
		const results = [isArrival(arrival.information), isArrival(departure.information)];

		// Assert
		expect(results).toEqual([true, false]);
	});

	it('seeds one guest for an arrival, clears the reason and keeps the guests already typed', () => {
		// Arrange
		const typed = modelOf(MovementTypeEnum.IN);
		typed.content.guests = [emptyGuest(), emptyGuest()];
		typed.content.reason = { kind: 'REASON', value: 'r', label: 'r' };

		// Act
		const seeded = modelOf(MovementTypeEnum.IN);
		const kept = withGuestType(typed, MovementTypeEnum.IN);
		const departure = withGuestType(typed, MovementTypeEnum.OUT);

		// Assert
		expect([
			seeded.content.guests.length,
			kept.content.guests.length,
			kept.content.reason,
			departure.content.guests.length,
		]).toEqual([1, 2, null, 0]);
	});

	it('requires a reason and complete guests for an arrival', () => {
		// Arrange
		const tree = build(modelOf(MovementTypeEnum.IN));

		// Act
		const kinds = [
			kindsOf(tree.content.reason()),
			kindsOf(tree.content.guests[0].firstName()),
			kindsOf(tree.content.guests[0].lastName()),
			kindsOf(tree.content.guests[0].birthday()),
			kindsOf(tree.content.participants()),
		];

		// Assert
		expect(kinds).toEqual([['required'], ['required', 'blank'], ['required', 'blank'], ['required'], []]);
	});

	it('refuses blank or too long names and a birthday in the future', () => {
		// Arrange
		const model = modelOf(MovementTypeEnum.IN);
		model.content.guests = [
			{ id: '', firstName: '   ', lastName: 'x'.repeat(151), birthday: new Date(2999, 0, 1) },
		];
		const tree = build(model);

		// Act
		const kinds = [
			kindsOf(tree.content.guests[0].firstName()),
			kindsOf(tree.content.guests[0].lastName()),
			kindsOf(tree.content.guests[0].birthday()),
		];

		// Assert
		expect(kinds).toEqual([['blank'], ['maxLength'], ['maxDate']]);
	});

	it('requires the leaving guests for a departure and no reason', () => {
		// Arrange
		const tree = build(modelOf(MovementTypeEnum.OUT));

		// Act
		const kinds = [
			kindsOf(tree.content.reason()),
			kindsOf(tree.content.participants()),
			kindsOf(tree.content.guests()),
		];

		// Assert
		expect(kinds).toEqual([[], ['required'], []]);
	});

	it('rebuilds the guests of an arrival with their identifiers', () => {
		// Arrange
		const movement = structuredClone(MOVEMENT_DTO) as unknown as MovementModel;

		// Act
		const model = toGuestMovementFormModel(movement);

		// Assert
		expect(model.content.participants).toEqual([]);
		expect(model.content.guests.map((guest: { id: string }) => guest.id)).toEqual(['pa1']);
		expect(model.content.reason).toEqual(movement.reason);
	});

	it('rebuilds the selected guests of a departure and a missing reason', () => {
		// Arrange
		const movement = {
			...structuredClone(MOVEMENT_DTO),
			type: { label: 'Out', value: 'OUT' },
			reason: undefined,
		} as unknown as MovementModel;

		// Act
		const model = toGuestMovementFormModel(movement);

		// Assert
		expect(model.content.participants).toHaveLength(1);
		expect([model.content.guests, model.content.reason]).toEqual([[], null]);
	});

	it('builds an empty guest from a participant or from nothing', () => {
		// Arrange
		const participant = {
			...structuredClone(PARTICIPANT_DTO),
			birthday: '2010-01-05',
		} as unknown as ParticipantModel;

		// Act
		const filled = emptyGuest(participant);
		const blank = emptyGuest();

		// Assert
		expect(filled.birthday).toEqual(new Date('2010-01-05'));
		expect(blank).toEqual({ id: '', firstName: '', lastName: '', birthday: null });
	});

	it('sends the guests with a formatted birthday and the leaving guests as content', () => {
		// Arrange
		const model: GuestMovementFormModel = {
			information: { dateTime: NOW, type: MovementTypeEnum.IN },
			content: {
				reason: { kind: 'REASON', value: 'r1', label: '' },
				participants: [{ participant: { id: 'g1' } } as MovementContentModel],
				guests: [
					{ id: '', firstName: 'A', lastName: 'B', birthday: new Date(2010, 0, 5) },
					{ id: 'g2', firstName: 'C', lastName: 'D', birthday: new Date(2011, 1, 6) },
				],
			},
		};

		// Act
		const dto = toGuestMovementDto(model);

		// Assert
		expect(dto.reason).toBe('r1');
		expect(dto.content).toEqual([{ participantId: 'g1' }]);
		expect(dto.guests).toEqual([
			{ id: undefined, firstName: 'A', lastName: 'B', birthday: '2010-01-05' },
			{ id: 'g2', firstName: 'C', lastName: 'D', birthday: '2011-02-06' },
		]);
	});
});
