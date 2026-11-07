import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { describe, expect, it } from 'vitest';

import {
	createProjectProfileForm,
	createProjectProfileInvitationForm,
	ProjectProfileFormModel,
	ProjectProfileInvitationFormModel,
	toProjectProfileDto,
	toProjectProfileFormModel,
	toProjectProfileInvitationFormModel,
	toProjectProfilesDto,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';
import { UserModel } from '@shared/models/model/user.model';

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' };
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' };

function kindsOf(field: { errors: () => readonly { kind: string }[] }): string[] {
	return field.errors().map((error) => error.kind);
}

describe('project profile form', () => {
	it('maps no profile to an empty form and a profile to its role and access dates', () => {
		// Arrange
		const profile = {
			role: { label: 'Chief', value: 'CHIEF' },
			startAccess: JUNE,
			endAccess: undefined,
		} as ProjectProfileModel;

		// Act
		const results = [toProjectProfileFormModel(), toProjectProfileFormModel(profile)];

		// Assert
		expect(results).toEqual([
			{ role: '', beginDateTime: null, endDateTime: null },
			{ role: 'CHIEF', beginDateTime: JUNE, endDateTime: null },
		]);
	});

	it('maps the models to the edition and invitation dtos', () => {
		// Arrange
		const model: ProjectProfileInvitationFormModel = {
			role: 'CHIEF',
			beginDateTime: JUNE,
			endDateTime: null,
			users: [{ id: 'u1', email: 'u1@x.test' } as UserModel],
		};

		// Act
		const dtos: object[] = [toProjectProfileDto(model), toProjectProfilesDto(model)];

		// Assert
		expect(dtos).toEqual([
			{ role: 'CHIEF', startAccess: JUNE, endAccess: undefined },
			{ role: 'CHIEF', startAccess: JUNE, endAccess: undefined, emails: ['u1@x.test'] },
		]);
	});

	it('requires a role and an end after the beginning', () => {
		// Arrange
		const model: WritableSignal<ProjectProfileFormModel> = signal({
			role: '',
			beginDateTime: AUGUST,
			endDateTime: JUNE,
		});
		const tree = TestBed.runInInjectionContext(() => createProjectProfileForm(model));

		// Act
		const kinds = [kindsOf(tree.role()), kindsOf(tree.endDateTime())];

		// Assert
		expect(kinds).toEqual([['required'], ['beginDateBeforeEndDate']]);
	});

	it('requires at least one user to invite', () => {
		// Arrange
		const model = signal(toProjectProfileInvitationFormModel());
		const tree = TestBed.runInInjectionContext(() => createProjectProfileInvitationForm(model));

		// Act
		const empty = kindsOf(tree.users());
		model.set({ ...model(), users: [{ id: 'u1' } as UserModel] });

		// Assert
		expect([empty, kindsOf(tree.users())]).toEqual([['required'], []]);
	});
});
