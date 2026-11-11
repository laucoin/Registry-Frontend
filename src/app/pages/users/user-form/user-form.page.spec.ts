import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Location } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { UserFacade } from '@pages/users/data/state/user.facade';
import { UserFormHarness } from '@pages/users/user-form/testing/user-form.harness';
import { UserFormPage } from '@pages/users/user-form/user-form.page';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { USER_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { UserMapper } from '@shared/mappers/user.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { UserModel } from '@shared/models/model/user.model';

const USER = UserMapper.toModel(USER_DTO);

describe('UserFormPage', () => {
	let user: WritableSignal<UserModel | undefined>;
	let user$: BehaviorSubject<UserModel | undefined>;
	let userError: WritableSignal<NotificationModel | undefined>;
	let metadataErrors: WritableSignal<Record<string, NotificationModel | undefined>>;
	let facade: Record<string, Mock | unknown>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;
	let navigate: Mock<(commands: string[]) => Promise<boolean>>;

	function create(params: Record<string, string> = { userId: 'u1' }): Promise<UserFormHarness> {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: UserFacade, useValue: facade },
				{ provide: Location, useValue: { back: vi.fn() } },
				{ provide: Router, useValue: { navigateByUrl, navigate } },
				{
					provide: ActivatedRoute,
					useValue: { snapshot: { params, url: [{ path: 'u1' }, { path: 'edit' }] } },
				},
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
			],
		});
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(UserFormPage), UserFormHarness);
	}

	beforeEach(() => {
		RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel;
		user = signal<UserModel | undefined>(undefined);
		user$ = new BehaviorSubject<UserModel | undefined>(undefined);
		userError = signal<NotificationModel | undefined>(undefined);
		metadataErrors = signal({});
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		navigate = vi.fn(() => Promise.resolve(true));
		facade = {
			user,
			user$,
			userError,
			metadataErrors,
			userLoading: signal(false),
			assignableRolesMetadata: signal([
				{ label: 'Admin', value: 'ADMIN' },
				{ label: 'Chief', value: 'CHIEF' },
			]),
			resetUser: vi.fn(),
			fetchUser: vi.fn(),
			fetchAssignableRoles: vi.fn(),
			updateUserRole: vi.fn((): Observable<UserModel> => of(USER)),
		};
	});

	it('goes back to the users list when no user is given', async () => {
		// Arrange
		const params = {};

		// Act
		await create(params);

		// Assert
		expect([navigateByUrl.mock.calls, (facade['fetchUser'] as Mock).mock.calls]).toEqual([
			[[RegistryRouteEnum.USERS]],
			[],
		]);
	});

	it('loads the user and the assignable roles, then fills the current role', async () => {
		// Arrange
		const harness = await create();

		// Act
		user.set(USER);
		user$.next(USER);

		// Assert
		expect([(facade['fetchUser'] as Mock).mock.calls, await harness.roles(), await harness.role()]).toEqual([
			[['u1']],
			['Admin', 'Chief'],
			'ADMIN',
		]);
	});

	it.each([
		{ name: 'the user', set: (): void => userError.set(PageStateHelper.toNotification(ERROR_500)) },
		{
			name: 'the roles',
			set: (): void => metadataErrors.set({ assignableRoles: PageStateHelper.toNotification(ERROR_500) }),
		},
	])('replaces the form with the failure to load $name, and reloads on demand', async ({ set }) => {
		// Arrange
		set();
		const harness = await create();
		(facade['fetchUser'] as Mock).mockClear();

		// Act
		await (await harness.loadError())?.retry();

		// Assert
		expect([await harness.role(), (facade['fetchUser'] as Mock).mock.calls]).toEqual([undefined, [['u1']]]);
	});

	it('does not save without a role', async () => {
		// Arrange
		user.set({ ...USER, role: undefined });
		const harness = await create();

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect(facade['updateUserRole']).not.toHaveBeenCalled();
	});

	it('saves the chosen role for the loaded user, then goes back to the list', async () => {
		// Arrange
		user.set(USER);
		user$.next(USER);
		const harness = await create();
		await harness.chooseRole('CHIEF');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([(facade['updateUserRole'] as Mock).mock.calls, navigate.mock.calls[0][0]]).toEqual([
			[['u1', 'CHIEF']],
			['../..'],
		]);
	});

	it('shows the failure of the save and stays open', async () => {
		// Arrange
		(facade['updateUserRole'] as Mock).mockReturnValue(throwError(() => ERROR_500));
		user.set(USER);
		user$.next(USER);
		const harness = await create();

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([(await (await harness.dialog()).error()) !== null, navigate.mock.calls.length]).toEqual([true, 0]);
	});

	it('goes back to the list when the dialog is closed', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.dialog()).cancel();

		// Assert
		expect(navigate.mock.calls[0][0]).toEqual(['../..']);
	});

	it('does not save before the user is loaded', async () => {
		// Arrange
		const harness = await create();
		await harness.chooseRole('CHIEF');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect(facade['updateUserRole']).not.toHaveBeenCalled();
	});

	it('ignores a cancelled navigation back to the list', async () => {
		// Arrange
		navigateByUrl.mockReturnValue(Promise.reject(new Error('cancelled')));

		// Act
		await create({});

		// Assert
		expect(navigateByUrl).toHaveBeenCalledTimes(1);
	});
});
