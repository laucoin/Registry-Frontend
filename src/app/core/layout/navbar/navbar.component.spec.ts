import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { MenuItemModel } from '@core/layout/data/model/menu-item.model';
import { MenuService } from '@core/layout/data/service/menu.service';
import { NavbarComponent } from '@core/layout/navbar/navbar.component';
import { NavbarHarness, NavbarSlotEnum } from '@core/layout/navbar/testing/navbar.harness';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

describe('NavbarComponent', () => {
	const LOGOUT_MENU: MenuItemModel = {
		label: 'menu.logout',
		icon: { library: 'solid', name: 'power-off' },
	};
	const ACCOUNT_MENU: MenuItemModel = {
		label: 'menu.account',
		url: '/my-account',
		icon: { library: 'solid', name: 'gear' },
	};
	const PROJECT_MENU: MenuItemModel = {
		label: 'menu.project',
		url: '/projects/42',
		icon: { library: 'solid', name: 'folder' },
	};
	let currentUser: WritableSignal<CurrentUserModel | undefined>;
	let appMenus: WritableSignal<MenuItemModel[]>;
	let projectMenus: WritableSignal<MenuItemModel[]>;
	let activeMenuUrl: WritableSignal<string | undefined>;
	let selectedProject: WritableSignal<ProjectModel | undefined>;
	let logout: Mock<() => void>;
	let tinyScreen: WritableSignal<boolean>;

	async function render(user?: Partial<CurrentUserModel>): Promise<NavbarHarness> {
		currentUser.set(user as CurrentUserModel | undefined);
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(NavbarComponent), NavbarHarness);
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
		RegistryConfig.config = {
			application: { name: 'Registry', organization: 'Org' },
		} as typeof RegistryConfig.config;
		currentUser = signal<CurrentUserModel | undefined>(undefined);
		appMenus = signal<MenuItemModel[]>([]);
		projectMenus = signal<MenuItemModel[]>([]);
		activeMenuUrl = signal<string | undefined>(undefined);
		selectedProject = signal<ProjectModel | undefined>(undefined);
		logout = vi.fn();
		tinyScreen = signal(false);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([{ path: '**', children: [] }]),
				{
					provide: MenuService,
					useValue: {
						activeMenuUrl,
						appMenus,
						userMenus: signal<MenuItemModel[]>([ACCOUNT_MENU]),
						projectMenus,
						logoutMenu: LOGOUT_MENU,
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen } },
				{
					provide: SessionFacade,
					useValue: {
						currentUser,
						selectedProject,
						currentProjectId: signal<string | undefined>('42'),
						logout,
					},
				},
			],
		});
	});

	it.each([
		['wide', false, true],
		['tiny', true, false],
	])('should draw the torn edge only on a %s screen', async (_label, tiny, torn) => {
		// Arrange
		tinyScreen.set(tiny);

		// Act
		const navbar = await render();

		// Assert
		expect(await navbar.isTorn()).toBe(torn);
	});

	it.each([
		[
			'the full name and the initials',
			{ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' },
			'Ada Lovelace',
			'AL',
		],
		['the single name available', { firstName: 'Ada', email: 'ada@example.org' }, 'Ada', 'A'],
		['the email when the user has no name', { email: 'ada@example.org' }, 'ada@example.org', 'A'],
	])('should show %s of the user', async (_label, user, fullName, initials) => {
		// Arrange
		const navbar = await render(user);

		// Act
		const shown = [await navbar.accountFullName(), await navbar.accountInitials()];

		// Assert
		expect(shown).toEqual([fullName, initials]);
	});

	it.each([
		['when there is one', { value: 'ADMIN', label: 'Administrator' }, 'Administrator'],
		['only when there is one', undefined, null],
	])('should show the role of the user %s', async (_label, role, expected) => {
		// Arrange
		const navbar = await render({ firstName: 'Ada', role } as Partial<CurrentUserModel>);

		// Act
		const shown = await navbar.accountRoleLabel();

		// Assert
		expect(shown).toBe(expected);
	});

	it('should hide the account menu when nobody is signed in', async () => {
		// Arrange
		const navbar = await render();

		// Act
		const shown = await navbar.hasAccountMenu();

		// Assert
		expect(shown).toBe(false);
	});

	it('should mark the menu of the current page and show the icons of the menus that have one', async () => {
		// Arrange
		appMenus.set([
			{ label: 'menu.home', url: '/' },
			{ label: 'menu.projects', url: '/projects' },
		]);
		activeMenuUrl.set('/projects');

		// Act
		const navbar = await render();

		// Assert
		expect(await navbar.appMenus()).toEqual([
			{ label: 'fr.menu.home', href: '/', current: false },
			{ label: 'fr.menu.projects', href: '/projects', current: true },
		]);
		expect(await navbar.menuIconCount(NavbarSlotEnum.END)).toBe(0);
	});

	it('should show the project menus with their icons in the project sub navigation', async () => {
		// Arrange
		projectMenus.set([PROJECT_MENU, { ...PROJECT_MENU, label: 'menu.other', url: '/projects/42/other' }]);

		// Act
		const navbar = await render();

		// Assert
		expect((await navbar.projectMenus()).map((menu) => menu.label)).toEqual(['fr.menu.project', 'fr.menu.other']);
		expect(await navbar.menuIconCount(NavbarSlotEnum.SUBNAV)).toBe(2);
	});

	it('should show the selected project and link it to the project home', async () => {
		// Arrange
		selectedProject.set({ name: 'Summer camp' } as ProjectModel);

		// Act
		const navbar = await render();

		// Assert
		expect(await navbar.selectedProjectName()).toBe('Summer camp');
		expect(await navbar.selectedProjectHref()).toBe('/projects/42');
	});

	it('should hide the project context when no project is selected', async () => {
		// Arrange
		const navbar = await render();

		// Act
		const name = await navbar.selectedProjectName();

		// Assert
		expect(name).toBeNull();
	});

	it('should sign the user out from the logout menu item only', async () => {
		// Arrange
		const navbar = await render({ firstName: 'Ada' });

		// Act
		await navbar.openAccountItem('fr.menu.account');
		const afterAccount = logout.mock.calls.length;
		await navbar.logout();

		// Assert
		expect(await navbar.accountItemLabels()).toEqual(['fr.menu.account', 'fr.menu.logout']);
		expect(afterAccount).toBe(0);
		expect(logout).toHaveBeenCalledTimes(1);
	});
});
