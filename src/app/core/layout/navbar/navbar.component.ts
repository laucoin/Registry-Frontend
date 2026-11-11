import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { RegistryConfig } from '@core/config/registry.config';
import { MenuItemModel } from '@core/layout/data/model/menu-item.model';
import { MenuService } from '@core/layout/data/service/menu.service';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { RouteHelper } from '@shared/helpers/route.helper';
import { CurrentUserModel } from '@shared/models/model/current-user.model';

import '@sgdf/ui/avatar';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/menu';
import '@sgdf/ui/menu-item';
import '@sgdf/ui/nav-item';
import '@sgdf/ui/navbar';

interface AccountView {
	fullName: string;
	initials: string;
	roleLabel: string | undefined;
}

function initialOf(name: string): string {
	return name.charAt(0);
}

function accountOf(user: CurrentUserModel): AccountView {
	const names = [user.firstName, user.lastName].filter((name): name is string => Boolean(name));
	const initials = names.map(initialOf).join('') || initialOf(user.email);
	return { fullName: names.join(' ') || user.email, initials: initials.toUpperCase(), roleLabel: user.role?.label };
}

/**
 * Objectif: Barre de navigation supérieure de l'application.
 * Périmètre: Affiche les menus de l'application, la sous-navigation du projet et le menu du compte que l'utilisateur a le droit de voir.
 * Limites: Ne décide pas des menus visibles ; le service de menus le fait, pour l'affichage uniquement.
 */
@Component({
	selector: 'app-navbar',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.css',
	imports: [RouterLink, TranslocoPipe, NgTemplateOutlet],
})
export class NavbarComponent {
	private readonly menuService = inject(MenuService);
	private readonly sessionFacade = inject(SessionFacade);
	protected readonly uiFacade = inject(UiFacade);

	protected readonly RegistryRouteEnum = RegistryRouteEnum;
	protected readonly application = RegistryConfig.config.application;

	protected readonly activeMenuUrl: Signal<string | undefined> = this.menuService.activeMenuUrl;
	protected readonly appMenus = this.menuService.appMenus;
	protected readonly userMenus = this.menuService.userMenus;
	protected readonly logoutMenu: MenuItemModel = this.menuService.logoutMenu;
	protected readonly projectMenus = this.menuService.projectMenus;

	protected readonly selectedProject = this.sessionFacade.selectedProject;
	protected readonly projectHomeUrl = computed(() =>
		RouteHelper.withProjectId(RegistryRouteEnum.PROJECT, this.sessionFacade.currentProjectId()),
	);
	private readonly currentUser: Signal<CurrentUserModel | undefined> = this.sessionFacade.currentUser;
	protected readonly account: Signal<AccountView | undefined> = computed(() => this.buildAccount());

	protected readonly logout: () => void = () => this.sessionFacade.logout();

	private buildAccount(): AccountView | undefined {
		const user = this.currentUser();
		return user && accountOf(user);
	}
}
