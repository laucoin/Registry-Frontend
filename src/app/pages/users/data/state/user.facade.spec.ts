import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, MockInstance, vi } from 'vitest';

import { BrowserService } from '@core/browser/browser.service';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserApi } from '@core/registry/state/user.api';
import { UserFacade } from '@pages/users/data/state/user.facade';
import { UserStore } from '@pages/users/data/state/user.store';
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { UserModel } from '@shared/models/model/user.model';

describe('UserFacade', () => {
	let facade: UserFacade;
	let findUsers: Mock<UserApi['findUsers']>;
	let blockUserById: Mock<UserApi['blockUserById']>;
	let unblockUserById: Mock<UserApi['unblockUserById']>;
	let findUserById: Mock<UserApi['findUserById']>;
	let getAssignableUserRoles: Mock<UserApi['getAssignableUserRoles']>;
	let updateUserRole: Mock<UserApi['updateUserRole']>;
	let deleteUserById: Mock<UserApi['deleteUserById']>;
	let exportUserById: Mock<UserApi['exportUserById']>;
	let notify: Mock<(message: unknown) => void>;

	beforeEach(() => {
		provideTestConfig();
		findUsers = vi.fn(() => of(pageOf<UserModel>([], 2)));
		blockUserById = vi.fn();
		unblockUserById = vi.fn();
		findUserById = vi.fn(() => of({ id: 'u1' } as UserModel));
		getAssignableUserRoles = vi.fn(() => of([{ label: 'Admin', value: 'ADMIN' }]));
		updateUserRole = vi.fn();
		deleteUserById = vi.fn();
		exportUserById = vi.fn();
		notify = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				UserFacade,
				UserStore,
				{
					provide: UserApi,
					useValue: {
						findUsers,
						blockUserById,
						unblockUserById,
						findUserById,
						getAssignableUserRoles,
						updateUserRole,
						deleteUserById,
						exportUserById,
					},
				},
				{ provide: UiFacade, useValue: { notify } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
			],
		});
		facade = TestBed.inject(UserFacade);
		facade.fetchUsersPage(2, 10);
		findUsers.mockClear();
	});

	it('fetches the requested page', () => {
		// Arrange
		const page = 3;

		// Act
		facade.fetchUsersPage(page, 10);

		// Assert
		expect(findUsers).toHaveBeenCalledWith(3, 10, expect.anything());
	});

	it('restarts from the first page after the search changed', () => {
		// Arrange
		facade.inputPageSearchParameters('ada', undefined);

		// Act
		facade.fetchUsersPage(4, 10);

		// Assert
		expect(findUsers).toHaveBeenCalledWith(0, 10, expect.anything());
	});

	it('leaves the search untouched when the criteria did not change', () => {
		// Arrange
		facade.inputPageSearchParameters('ada', true);
		facade.fetchUsersPage(0, 10);

		// Act
		facade.inputPageSearchParameters('ada', true);

		// Assert
		expect(facade.usersPageResetSearch()).toBe(false);
	});

	it('translates the status labels except the empty option', () => {
		// Arrange
		const expected: (string | undefined)[] = ['-', 't:users.visible.true', 't:users.visible.false'];

		// Act
		const labels = facade.statusMetadata().map((item: { label?: string }) => item.label);

		// Assert
		expect(labels).toEqual(expected);
	});

	it('notifies and reloads the batches already shown after blocking a user', () => {
		// Arrange
		blockUserById.mockReturnValue(of({ id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel));

		// Act
		facade.blockUser('u1');

		// Assert
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'users.notifications.block.title' }));
		expect(findUsers).toHaveBeenCalledWith(0, 30, expect.anything());
		expect(facade.userLoading()).toBe(false);
	});

	it('does not refresh when the command fails', () => {
		// Arrange
		blockUserById.mockReturnValue(failing(ERROR_500));

		// Act
		facade.blockUser('u1');

		// Assert
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Title' }));
		expect(findUsers).not.toHaveBeenCalled();
		expect(facade.userLoading()).toBe(false);
	});

	it('returns the updated user after a role change', () => {
		// Arrange
		updateUserRole.mockReturnValue(of({ id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel));
		let updated: UserModel | undefined;

		// Act
		facade.updateUserRole('u1', 'ADMIN').subscribe((user) => {
			updated = user;
		});

		// Assert
		expect(updated?.id).toBe('u1');
		expect(notify).toHaveBeenCalledWith(
			expect.objectContaining({ summary: 'users.notifications.update-role.title' }),
		);
	});

	it('notifies and refreshes after deleting a user', () => {
		// Arrange
		deleteUserById.mockReturnValue(of(undefined));

		// Act
		facade.deleteUser({ id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel);

		// Assert
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'users.notifications.delete.title' }));
		expect(findUsers).toHaveBeenCalledTimes(1);
	});

	it('downloads the exported data of a user', () => {
		// Arrange
		const data: object = { id: 'u1' };
		exportUserById.mockReturnValue(of(data));
		const downloadJson: MockInstance = vi
			.spyOn(TestBed.inject(BrowserService), 'downloadJson')
			.mockImplementation((): void => undefined);

		// Act
		facade.exportUser({ id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel).subscribe();

		// Assert
		expect(exportUserById).toHaveBeenCalledWith('u1');
		expect(downloadJson).toHaveBeenCalledWith(data, 'registry-user-u1.json');
	});

	it('notifies the failure of an export without downloading', () => {
		// Arrange
		exportUserById.mockReturnValue(failing(ERROR_500));
		const downloadJson: MockInstance = vi
			.spyOn(TestBed.inject(BrowserService), 'downloadJson')
			.mockImplementation((): void => undefined);

		// Act
		facade.exportUser({ id: 'u1' } as UserModel).subscribe({ error: (): void => undefined });

		// Assert
		expect(downloadJson).not.toHaveBeenCalled();
		expect(notify).toHaveBeenCalledTimes(1);
	});

	it('exposes the failure of the user fetch', () => {
		// Arrange
		Object.assign(TestBed.inject(UserApi), { findUserById: vi.fn(() => failing(ERROR_500)) });

		// Act
		facade.fetchUser('u1');

		// Assert
		expect(facade.userError()?.summary).toBe('Title');
	});

	it('notifies and reloads the batches already shown after unblocking a user', () => {
		// Arrange
		unblockUserById.mockReturnValue(of({ id: 'u1', firstName: 'Ada', lastName: 'L' } as UserModel));

		// Act
		facade.unblockUser('u1');

		// Assert
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'users.notifications.unblock.title' }));
		expect(findUsers).toHaveBeenCalledWith(0, 30, expect.anything());
	});

	it('loads the assignable roles', () => {
		// Arrange
		const expected = [{ label: 'Admin', value: 'ADMIN' }];

		// Act
		facade.fetchAssignableRoles();

		// Assert
		expect(facade.assignableRolesMetadata()).toEqual(expected);
	});

	it('forgets the loaded user when reset', () => {
		// Arrange
		facade.fetchUser('u1');
		const loaded = facade.user()?.id;

		// Act
		facade.resetUser();

		// Assert
		expect([loaded, facade.user()]).toEqual(['u1', undefined]);
	});
});
