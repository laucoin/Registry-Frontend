import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { describe, expect, it } from 'vitest';

import {
	AddMembersFormModel,
	createAddMembersForm,
	emptyAddMembersFormModel,
	toMemberIds,
} from '@pages/projects/[projectId]/configuration/groups/group-member-list/add-members.form';
import { ParticipantModel } from '@shared/models/model/participant.model';

describe('add members form', () => {
	it('requires at least one participant', () => {
		// Arrange
		const model = signal(emptyAddMembersFormModel());
		const tree = TestBed.runInInjectionContext(() => createAddMembersForm(model));

		// Act
		const empty = tree
			.participants()
			.errors()
			.map((error: { kind: string }) => error.kind);
		model.set({ participants: [{ id: 'pa1' } as ParticipantModel] });

		// Assert
		expect([empty, tree.participants().errors()]).toEqual([['required'], []]);
	});

	it('lists the ids of the chosen participants', () => {
		// Arrange
		const model: AddMembersFormModel = {
			participants: [{ id: 'pa1' } as ParticipantModel, { id: 'pa2' } as ParticipantModel],
		};

		// Act
		const ids = toMemberIds(model);

		// Assert
		expect(ids).toEqual(['pa1', 'pa2']);
	});
});
