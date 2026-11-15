import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { describe, expect, it } from 'vitest';

import { createUserForm, toUserFormModel, UserFormModel } from '@pages/users/user-form/user.form';
import { UserModel } from '@shared/models/model/user.model';

describe('user form', () => {
	it.each([
		[undefined, { role: '' }],
		[{ role: undefined }, { role: '' }],
		[{ role: { label: 'Admin', value: 'ADMIN' } }, { role: 'ADMIN' }],
	])('maps %j to the model %j', (user: object | undefined, expected: UserFormModel) => {
		// Arrange
		const source = user as UserModel | undefined;

		// Act
		const model = toUserFormModel(source);

		// Assert
		expect(model).toEqual(expected);
	});

	it('requires a role', () => {
		// Arrange
		const model = signal(toUserFormModel());
		const tree = TestBed.runInInjectionContext(() => createUserForm(model));

		// Act
		const whenEmpty = tree
			.role()
			.errors()
			.map((error: { kind: string }) => error.kind);
		model.set({ role: 'ADMIN' });

		// Assert
		expect([whenEmpty, tree.role().errors()]).toEqual([['required'], []]);
	});
});
