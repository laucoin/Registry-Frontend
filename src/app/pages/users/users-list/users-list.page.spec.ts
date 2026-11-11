import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserFacade } from '@pages/users/data/state/user.facade';
import { UsersListHarness } from '@pages/users/users-list/testing/users-list.harness';
import { UsersListPage } from '@pages/users/users-list/users-list.page';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { USER_DTO } from '@shared/helpers/testing/response-fixtures';
import { UserMapper } from '@shared/mappers/user.mapper';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { PageModel } from '@shared/models/model/page.model';
import { UserModel } from '@shared/models/model/user.model';

@Component({ template: '' })
class EmptyComponent {}

const user = (overrides: Partial<UserModel> = {}): UserModel => ({ ...UserMapper.toModel(USER_DTO), ...overrides });

const pageOf = (content: UserModel[], hasNext = false): PageModel<UserModel> => ({
	content,
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : content.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

describe('UsersListPage', () => {
	let facade: Record<string, unknown>;

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	async function create(page: PageModel<UserModel> | undefined, url = '/'): Promise<UsersListHarness> {
		(facade['usersPage'] as ReturnType<typeof signal>).set(page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(UsersListPage), UsersListHarness);
	}

	beforeEach(() => {
		facade = {
			usersPage: signal(undefined),
			usersPageError: signal(undefined),
			usersPageLoading: signal(false),
			usersPageSilentLoading: signal(false),
			usersPageQueryParam: signal(undefined),
			actualUsersPageIsVisibleParam: signal(undefined),
			statusMetadata: signal([
				{ label: '-', value: undefined },
				{ label: 'Visible', value: true },
			]),
			inputPageSearchParameters: vi.fn(),
			fetchUsersPage: vi.fn(),
		};
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { global: { list: { 'active-filters': '{{ count }}' } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				{ provide: UserFacade, useValue: facade },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: ElementConfirmationService, useValue: { confirm: vi.fn() } },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({
							id: 'me',
							authorities: [
								UserAuthorityEnum.REGISTRY_USER_R,
								UserAuthorityEnum.REGISTRY_USER_U,
								UserAuthorityEnum.REGISTRY_USER_SOFT_DELETE,
								UserAuthorityEnum.REGISTRY_USER_RESTORE,
								UserAuthorityEnum.REGISTRY_USER_D,
							],
						}),
					},
				},
			],
		});
	});

	it('loads the first batch with the default filters when the url carries none', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const shown = [await harness.title(), await harness.searchedText()];

		// Assert
		expect([shown, calls('inputPageSearchParameters'), calls('fetchUsersPage')]).toEqual([
			['users.list.title', ''],
			[[undefined, undefined, undefined]],
			[[undefined, undefined]],
		]);
	});

	it('starts from the filters carried by the url', async () => {
		// Arrange
		const harness = await create(undefined, '/?q=grace&isVisible=false');

		// Act
		const searched = await harness.searchedText();

		// Assert
		expect([searched, calls('inputPageSearchParameters')[0]]).toEqual(['grace', ['grace', false, undefined]]);
	});

	it('searches the typed text from the first batch and writes it in the url', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await harness.search('grace');

		// Assert
		expect([
			calls('inputPageSearchParameters').at(-1),
			calls('fetchUsersPage').at(-1),
			TestBed.inject(Router).url,
		]).toEqual([['grace', undefined, undefined], [0, undefined], '/?q=grace']);
	});

	it.each([
		{ name: 'no filter', query: undefined, visible: undefined, expected: undefined },
		{ name: 'a searched text', query: 'grace', visible: undefined, expected: '1' },
		{ name: 'a searched text and a visibility', query: 'grace', visible: false, expected: '2' },
	])('counts the active filters with $name', async ({ query, visible, expected }) => {
		// Arrange
		(facade['usersPageQueryParam'] as ReturnType<typeof signal>).set(query);
		(facade['actualUsersPageIsVisibleParam'] as ReturnType<typeof signal>).set(visible);
		const harness = await create(pageOf([]));

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe(expected);
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		(facade['usersPageQueryParam'] as ReturnType<typeof signal>).set('grace');
		const harness = await create(pageOf([]), '/?q=grace');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await harness.searchedText(), calls('inputPageSearchParameters').at(-1)]).toEqual([
			'',
			[undefined, undefined, undefined],
		]);
	});

	it.each([
		{
			name: 'a visible user who logged in, with a role',
			overrides: {},
			expected: {
				name: 'Grace H',
				email: 'g@x.test',
				lastLogin: 'users.last-login.label',
				role: 'Admin',
				hidden: false,
				disabled: false,
			},
		},
		{
			name: 'a blocked user who never logged in, without a role',
			overrides: { visible: false, lastLogin: undefined, role: undefined },
			expected: {
				name: 'Grace H',
				email: 'g@x.test',
				lastLogin: 'users.last-login.never',
				role: undefined,
				hidden: true,
				disabled: true,
			},
		},
	])('shows $name', async ({ overrides, expected }) => {
		// Arrange
		const harness = await create(pageOf([user(overrides as Partial<UserModel>)]));

		// Act
		const [row] = await harness.rows();

		// Assert
		expect(row).toEqual(expected);
	});

	it.each([
		{
			name: 'another user the actions allowed on them',
			id: 'u1',
			expected: ['update-role', 'export', 'block', 'delete'],
		},
		{ name: 'the signed-in user no action on their own account', id: 'me', expected: [] },
	])('offers $name', async ({ id, expected }) => {
		// Arrange
		const harness = await create(pageOf([user({ id })]));

		// Act
		const actions = await (await harness.actions(id)).actions();

		// Assert
		expect(actions.map((action) => action.id)).toEqual(expected);
	});

	it('asks for the next batch when the list asks for it', async () => {
		// Arrange
		const harness = await create(pageOf([user()], true));

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect(calls('fetchUsersPage').at(-1)).toEqual([1, 20]);
	});
});
