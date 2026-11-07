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
import { CurrentUserModel } from '@shared/models/model/current-user.model';

import '@sgdf/ui/avatar';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/menu';
import '@sgdf/ui/menu-item';
import '@sgdf/ui/nav-item';
import '@sgdf/ui/navbar';

function initialOf(name: string | undefined): string {
	return name?.charAt(0) ?? '';
}

function initialsOf(user: CurrentUserModel | undefined): string {
	if (!user) return '';
	const initials = [user.firstName, user.lastName].map(initialOf).join('');
	return (initials || initialOf(user.email)).toUpperCase();
}

/**
 * Purpose: Barre de navigation supérieure de l'application.
 * Scope: Affiche les menus de l'application, la sous-navigation du projet et le menu du compte que l'utilisateur a le droit de voir.
 * Limits: Ne décide pas des menus visibles ; le service de menus le fait, pour l'affichage uniquement.
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
	protected readonly projectMenus = computed(() =>
		this.menuService.projectMenus().flatMap((menu) => menu.items ?? [menu]),
	);

	protected readonly selectedProject = this.sessionFacade.selectedProject;
	protected readonly projectHomeUrl = computed(() =>
		RegistryRouteEnum.PROJECT.replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
	);
	protected readonly currentUser: Signal<CurrentUserModel | undefined> = this.sessionFacade.currentUser;
	protected readonly userFullName = computed(() => this.buildUserFullName());
	protected readonly userInitials = computed(() => initialsOf(this.currentUser()));

	protected readonly logout: () => void = () => this.sessionFacade.logout();

	private buildUserFullName(): string {
		const user = this.currentUser();
		return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || (user?.email ?? '');
	}
}
