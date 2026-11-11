import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserFacade } from '@pages/users/data/state/user.facade';
import { UserActions } from '@pages/users/users-list/user-actions.service';
import { defined } from '@shared/helpers/testing/defined';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ElementActionModel } from '@shared/models/model/element-action.model';
import { UserModel } from '@shared/models/model/user.model';

const ACTIVE = { id: 'u2', visible: true, firstName: 'Ada', lastName: 'Lovelace' } as UserModel;
const BLOCKED: UserModel = { ...ACTIVE, visible: false };

describe('UserActions', () => {
	let actions: UserActions;
	let authorities: WritableSignal<string[]>;
	let currentUserId: WritableSignal<string>;
	let facade: Record<string, Mock>;
	let confirm: Mock<(confirmation: { accept: () => void; acceptSeverity: SeverityEnum; phrase?: string }) => void>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	beforeEach(() => {
		authorities = signal(['REGISTRY_USER_U', 'REGISTRY_USER_D']);
		currentUserId = signal('u1');
		facade = {
			blockUser: vi.fn(),
			unblockUser: vi.fn(),
			deleteUser: vi.fn(),
			exportUser: vi.fn(() => of(undefined)),
		};
		confirm = vi.fn();
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			providers: [
				UserActions,
				{ provide: UserFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: { currentUser: (): unknown => ({ id: currentUserId(), authorities: authorities() }) },
				},
				{ provide: UiFacade, useValue: { confirm } },
				{ provide: Router, useValue: { navigateByUrl, url: '/users?q=ada' } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		actions = TestBed.inject(UserActions);
	});

	function find(user: UserModel, id: string): ElementActionModel | undefined {
		return actions.actionsFor(user).find((action) => action.id === id);
	}

	it('offers every command but unblock for an active user', () => {
		// Arrange
		const user = ACTIVE;

		// Act
		const ids = actions.actionsFor(user).map((action) => action.id);

		// Assert
		expect(ids).toEqual(['update-role', 'export', 'block', 'delete']);
	});

	it('offers unblock instead of block for a blocked user', () => {
		// Arrange
		const user: UserModel = BLOCKED;

		// Act
		const ids = actions.actionsFor(user).map((action) => action.id);

		// Assert
		expect(ids).toEqual(['update-role', 'export', 'unblock', 'delete']);
	});

	it('offers nothing on the account of the signed-in user', () => {
		// Arrange
		currentUserId.set('u2');

		// Act
		const shown = actions.actionsFor(ACTIVE);

		// Assert
		expect(shown).toEqual([]);
	});

	it('gates block and unblock on their own authorities', () => {
		// Arrange
		const disabled = (element: UserModel, id: string): boolean =>
			defined(actions.actionsFor(element).find((it) => it.id === id)).disabled;
		authorities.set(['REGISTRY_USER_U', 'REGISTRY_USER_D']);

		// Act
		const without = [disabled(ACTIVE, 'block'), disabled(BLOCKED, 'unblock')];
		authorities.set(['REGISTRY_USER_U', 'REGISTRY_USER_D', 'REGISTRY_USER_SOFT_DELETE', 'REGISTRY_USER_RESTORE']);
		const withThem = [disabled(ACTIVE, 'block'), disabled(BLOCKED, 'unblock')];

		// Assert
		expect(without).toEqual([true, true]);
		expect(withThem).toEqual([false, false]);
	});

	it('disables the commands the signed-in user has no authority for', () => {
		// Arrange
		authorities.set(['REGISTRY_USER_U', 'REGISTRY_USER_SOFT_DELETE']);

		// Act
		const flags = ['update-role', 'block', 'delete'].map((id) => defined(find(ACTIVE, id)).disabled);

		// Assert
		expect(flags).toEqual([false, false, true]);
	});

	it('opens the role edition route of the user', () => {
		// Arrange
		const updateRole = defined(find(ACTIVE, 'update-role'));

		// Act
		updateRole.run();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledWith(expect.stringMatching(/u2.*\?q=ada$/));
	});

	it('ignores a cancelled navigation to the role edition', async () => {
		// Arrange
		navigateByUrl.mockReturnValue(Promise.reject(new Error('cancelled')));
		const updateRole = defined(find(ACTIVE, 'update-role'));

		// Act
		updateRole.run();
		await Promise.resolve();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledTimes(1);
	});

	it.each([
		['block', 'blockUser', SeverityEnum.WARNING, ACTIVE, 'u2'],
		['export', 'exportUser', SeverityEnum.INFO, ACTIVE, ACTIVE],
		['unblock', 'unblockUser', SeverityEnum.INFO, BLOCKED, 'u2'],
		['delete', 'deleteUser', SeverityEnum.DANGER, ACTIVE, ACTIVE],
	])(
		'asks for a confirmation before running %s, then calls the facade',
		(id, call, severity, user, argument: unknown) => {
			// Arrange
			const action = defined(find(user, id));

			// Act
			action.run();
			const beforeAccept = facade[call].mock.calls.length;
			confirm.mock.calls[0][0].accept();

			// Assert
			expect(beforeAccept).toBe(0);
			expect(confirm.mock.calls[0][0].acceptSeverity).toBe(severity);
			expect(facade[call]).toHaveBeenCalledWith(argument);
			expect(action.danger).toBe(severity === SeverityEnum.DANGER);
		},
	);

	it.each([
		{
			name: 'requires the typed phrase to delete a user',
			id: 'delete',
			user: ACTIVE,
			phrase: 'users.actions.confirmations.delete.phrase',
		},
		{ name: 'needs no typed phrase to block a user', id: 'block', user: ACTIVE, phrase: undefined },
	])('$name', ({ id, user, phrase }) => {
		// Arrange
		const action = defined(find(user, id));

		// Act
		action.run();

		// Assert
		expect(confirm.mock.calls[0][0].phrase).toBe(phrase);
	});
});
