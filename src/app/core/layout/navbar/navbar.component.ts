import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ConfigModel } from "@core/config/model/config.model";
import { RegistryConfig } from "@core/config/registry.config";
import { MenuItemModel } from '@core/layout/data/model/menu-item.model'
import { MenuService } from '@core/layout/data/service/menu.service'
import { SessionFacade } from '@core/registry/state/session.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { TranslocoPipe } from '@jsverse/transloco'
import { CurrentUserModel } from '@shared/models/model/current-user.model'

/**
 * Purpose: Top navigation bar of the application.
 * Scope: Renders the application menus, the project sub-navigation and the account menu the user is allowed to see.
 * Limits: Does not decide which menus are visible; the menu service does, for display only.
 */
@Component({
	selector: 'app-navbar',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.css',
	imports: [RouterLink, TranslocoPipe, NgTemplateOutlet],
})
export class NavbarComponent {
	private readonly menuService: MenuService = inject(MenuService)
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly RegistryRouteEnum: typeof RegistryRouteEnum = RegistryRouteEnum
	protected readonly application: ConfigModel['application'] = RegistryConfig.config.application;

	protected readonly activeMenuUrl: Signal<string | undefined> = this.menuService.activeMenuUrl
	protected readonly appMenus: Signal<MenuItemModel[]> = this.menuService.appMenus
	protected readonly userMenus: Signal<MenuItemModel[]> = this.menuService.userMenus
	protected readonly logoutMenu: MenuItemModel = this.menuService.logoutMenu
	protected readonly projectMenus: Signal<MenuItemModel[]> = computed((): MenuItemModel[] =>
		this.menuService.projectMenus().flatMap((menu: MenuItemModel): MenuItemModel[] => menu.items ?? [menu]),
	)

	protected readonly currentUser: Signal<CurrentUserModel | undefined> = this.sessionFacade.currentUser
	protected readonly userFullName: Signal<string> = computed((): string => {
		const user: CurrentUserModel | undefined = this.currentUser()
		return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || (user?.email ?? '')
	})
	protected readonly userInitials: Signal<string> = computed((): string => {
		const user: CurrentUserModel | undefined = this.currentUser()
		const initials: string = [user?.firstName, user?.lastName].map((name: string | undefined): string => name?.charAt(0) ?? '').join('')
		return (initials || user?.email?.charAt(0) || '').toUpperCase()
	})

	protected readonly logout: () => void = (): void => this.sessionFacade.logout()
}
