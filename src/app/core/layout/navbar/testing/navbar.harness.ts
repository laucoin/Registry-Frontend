import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export enum NavbarSlotEnum {
	END = 'end',
	SUBNAV = 'subnav',
}

export interface NavItemState {
	label: string;
	href: string | null;
	current: boolean;
}

const ACCOUNT_BUTTON = byTestId('navbar-account-menu-button');
const NAV_LINK = byTestId('navbar-nav-link');
const PROJECT_LINK = byTestId('navbar-project-home-link');

/**
 * Objectif: Pilote la barre de navigation dans les tests.
 * Périmètre: Lit les menus de l'application et du projet, le projet sélectionné et le menu du compte, et déclenche la déconnexion.
 * Limites: N'ouvre pas le menu déroulant du compte ; ses éléments sont lus directement dans le DOM léger.
 */
export class NavbarHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-navbar';

	private readonly frame = this.locatorFor(byTestId('navbar-frame'));
	private readonly accountButton = this.locatorForOptional(ACCOUNT_BUTTON);
	private readonly accountName = this.locatorFor(`${ACCOUNT_BUTTON} strong`);
	private readonly accountRole = this.locatorForOptional(`${ACCOUNT_BUTTON} small`);
	private readonly accountAvatar = this.locatorFor(`${ACCOUNT_BUTTON} sgdf-avatar`);
	private readonly accountItems = this.locatorForAll(byTestId('navbar-account-menu-item'));
	private readonly projectLink = this.locatorForOptional(PROJECT_LINK);
	private readonly projectName = this.locatorFor(`${PROJECT_LINK} strong`);

	public async isTorn(): Promise<boolean> {
		return (await this.frame()).getProperty<boolean>('torn');
	}

	public async appMenus(): Promise<NavItemState[]> {
		return this.navItems(NavbarSlotEnum.END);
	}

	public async projectMenus(): Promise<NavItemState[]> {
		return this.navItems(NavbarSlotEnum.SUBNAV);
	}

	public async menuIconCount(slot: NavbarSlotEnum): Promise<number> {
		return (await this.locatorForAll(`${NAV_LINK}[slot="${slot}"] ${byTestId('navbar-nav-icon')}`)()).length;
	}

	public async hasAccountMenu(): Promise<boolean> {
		return (await this.accountButton()) !== null;
	}

	public async accountFullName(): Promise<string> {
		return (await this.accountName()).text();
	}

	public async accountInitials(): Promise<string | null> {
		return (await this.accountAvatar()).getAttribute('initials');
	}

	public async accountRoleLabel(): Promise<string | null> {
		const role = await this.accountRole();
		return role ? role.text() : null;
	}

	public async selectedProjectName(): Promise<string | null> {
		return (await this.projectLink()) ? (await this.projectName()).text() : null;
	}

	public async selectedProjectHref(): Promise<string | null> {
		return (await this.projectLink())?.getAttribute('href') ?? null;
	}

	public async accountItemLabels(): Promise<string[]> {
		const items = await this.accountItems();
		return Promise.all(items.map(async (item) => (await item.text()).trim()));
	}

	public async openAccountItem(label: string): Promise<void> {
		const items = await this.accountItems();
		const labels = await this.accountItemLabels();
		await items[labels.indexOf(label)].click();
	}

	public async logout(): Promise<void> {
		const items = await this.accountItems();
		const variants = await Promise.all(items.map((item) => item.getAttribute('variant')));
		await items[variants.indexOf('danger')].click();
	}

	private async navItems(slot: NavbarSlotEnum): Promise<NavItemState[]> {
		const items = await this.locatorForAll(`${NAV_LINK}[slot="${slot}"]`)();
		return Promise.all(items.map((item) => this.navItemState(item)));
	}

	private async navItemState(item: TestElement): Promise<NavItemState> {
		return {
			label: (await item.text()).trim(),
			href: await item.getAttribute('href'),
			current: await item.getProperty<boolean>('current'),
		};
	}
}
