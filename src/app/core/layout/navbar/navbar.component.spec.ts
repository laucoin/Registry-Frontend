import { NgTemplateOutlet } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistryConfig } from '@core/config/registry.config';
import { MenuItemModel } from '@core/layout/data/model/menu-item.model';
import { MenuService } from '@core/layout/data/service/menu.service';
import { SessionFacade } from '@core/registry/state/session.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { MockBuilder } from 'ng-mocks';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
	const LOGOUT_MENU: MenuItemModel = { label: 'menu.logout', url: '/logout', icon: { library: 'solid', name: 'power-off' } };
	const PROJECT_MENU: MenuItemModel = { label: 'menu.project', url: '/projects/1', icon: { library: 'solid', name: 'folder' } };
	let currentUser: WritableSignal<CurrentUserModel | undefined>;
	let projectMenus: WritableSignal<MenuItemModel[]>;
	let selectedProject: WritableSignal<ProjectModel | undefined>;
	let logout: ReturnType<typeof vi.fn>;
	let fixture: ComponentFixture<NavbarComponent>;

	function userButton(): HTMLElement {
		return fixture.nativeElement.querySelector('button[slot="trigger"]');
	}

	async function render(user: Partial<CurrentUserModel> | undefined): Promise<void> {
		currentUser.set(user as CurrentUserModel | undefined);
		fixture = TestBed.createComponent(NavbarComponent);
		await fixture.whenStable();
	}

	beforeEach(async () => {
		RegistryConfig.config = { application: { name: 'Registry', organization: 'Org' } } as typeof RegistryConfig.config;
		currentUser = signal<CurrentUserModel | undefined>(undefined);
		projectMenus = signal<MenuItemModel[]>([]);
		selectedProject = signal<ProjectModel | undefined>(undefined);
		logout = vi.fn();
		await MockBuilder(NavbarComponent)
			.keep(NgTemplateOutlet)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({
				provide: MenuService,
				useValue: {
					activeMenuUrl: signal<string | undefined>(undefined),
					appMenus: signal<MenuItemModel[]>([]),
					userMenus: signal<MenuItemModel[]>([]),
					projectMenus,
					logoutMenu: LOGOUT_MENU,
				},
			})
			.provide({ provide: SessionFacade, useValue: { currentUser, selectedProject, logout } });
	});

	it('should show the full name and the initials of the user', async () => {
		// Arrange
		await render({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' });

		// Act
		const initials: string | null = fixture.nativeElement.querySelector('sgdf-avatar').getAttribute('initials');

		// Assert
		expect(userButton().querySelector('strong')?.textContent).toBe('Ada Lovelace');
		expect(initials).toBe('AL');
	});

	it('should use the single name available when the other one is missing', async () => {
		// Arrange
		await render({ firstName: 'Ada', email: 'ada@example.org' });

		// Act
		const initials: string | null = fixture.nativeElement.querySelector('sgdf-avatar').getAttribute('initials');

		// Assert
		expect(userButton().querySelector('strong')?.textContent).toBe('Ada');
		expect(initials).toBe('A');
	});

	it('should fall back on the email when the user has no name', async () => {
		// Arrange
		await render({ email: 'ada@example.org' });

		// Act
		const initials: string | null = fixture.nativeElement.querySelector('sgdf-avatar').getAttribute('initials');

		// Assert
		expect(userButton().querySelector('strong')?.textContent).toBe('ada@example.org');
		expect(initials).toBe('A');
	});

	it('should show the role of the user when there is one', async () => {
		// Arrange
		await render({ firstName: 'Ada', role: { value: 'ADMIN', label: 'Administrator' } } as Partial<CurrentUserModel>);

		// Act
		const role: string | undefined = userButton().querySelector('small')?.textContent ?? undefined;

		// Assert
		expect(role).toBe('Administrator');
	});

	it('should hide the account menu when nobody is signed in', async () => {
		// Arrange
		await render(undefined);

		// Act
		const menu: Element | null = fixture.nativeElement.querySelector('sgdf-menu');

		// Assert
		expect(menu).toBeNull();
	});

	it('should flatten the project menus that group sub items', async () => {
		// Arrange
		projectMenus.set([{ label: 'group', items: [PROJECT_MENU] }, { ...PROJECT_MENU, label: 'menu.other' }]);
		await render(undefined);

		// Act
		const labels: (string | undefined)[] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-nav-item[slot="subnav"]'))
			.map((item: HTMLElement): string | undefined => item.textContent?.trim());

		// Assert
		expect(labels).toEqual(['menu.project', 'menu.other']);
	});

	it('should show the selected project in the context slot', async () => {
		// Arrange
		selectedProject.set({ name: 'Summer camp' } as ProjectModel);
		await render(undefined);

		// Act
		const context: HTMLElement | null = fixture.nativeElement.querySelector('[slot="context"]');

		// Assert
		expect(context?.querySelector('strong')?.textContent).toBe('Summer camp');
	});

	it('should hide the context slot when no project is selected', async () => {
		// Arrange
		await render(undefined);

		// Act
		const context: HTMLElement | null = fixture.nativeElement.querySelector('[slot="context"]');

		// Assert
		expect(context).toBeNull();
	});

	it('should sign the user out from the logout menu item', async () => {
		// Arrange
		await render({ firstName: 'Ada' });
		const logoutItem: HTMLElement = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-menu-item'))
			.find((item: HTMLElement): boolean => item.getAttribute('variant') === 'danger')!;

		// Act
		logoutItem.click();

		// Assert
		expect(logout).toHaveBeenCalledTimes(1);
	});
});
