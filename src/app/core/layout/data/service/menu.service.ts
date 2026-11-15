import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

import { filter, map, startWith } from 'rxjs';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import {
	APP_LEVEL_MENUS,
	LOGOUT_MENU,
	PROJECT_LEVEL_MENUS,
	USER_LEVEL_MENUS,
} from '@core/layout/data/menu.definitions';
import { MenuItemModel } from '@core/layout/data/model/menu-item.model';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RouteHelper } from '@shared/helpers/route.helper';

/**
 * Objectif: Donne les menus de navigation que l'utilisateur connecté a le droit de voir.
 * Périmètre: Filtre les définitions de menus selon les autorités de l'utilisateur et les options du projet, résout les urls de projet et trouve le menu correspondant à l'url courante.
 * Limites: Filtre pour l'affichage uniquement ; le backend est la frontière de sécurité.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
	private readonly session = inject(SessionFacade);
	private readonly router = inject(Router);
	private readonly currentPath = toSignal(
		this.router.events.pipe(
			filter((event: unknown) => event instanceof NavigationEnd),
			map(() => this.pathOf(this.router.url)),
			startWith(this.pathOf(this.router.url)),
		),
		{ requireSync: true },
	);

	public readonly appMenus = computed(() => this.filterMenus(APP_LEVEL_MENUS));

	public readonly projectMenus = computed(() => this.filterMenus(PROJECT_LEVEL_MENUS));

	public readonly userMenus = computed(() => this.filterMenus(USER_LEVEL_MENUS));

	public readonly logoutMenu: MenuItemModel = LOGOUT_MENU;

	public readonly activeMenuUrl: Signal<string | undefined> = computed(
		(): string | undefined =>
			[...this.appMenus(), ...this.projectMenus()]
				.map((menu) => menu.url)
				.filter((url): url is string => url !== undefined && this.isPrefixOfCurrentPath(url))
				.sort((first, second) => second.length - first.length)[0],
	);

	private filterMenus(menus: MenuItemModel[]): MenuItemModel[] {
		const currentUser = this.session.currentUser();
		const project = this.session.selectedProject();

		return menus
			.filter((menu) => CurrentUserHelper.isFeasible(currentUser, project, menu))
			.map((menu) => this.resolve(menu));
	}

	private resolve(menu: MenuItemModel): MenuItemModel {
		return {
			...menu,
			label: this.fallbackLabelOf(menu) ?? menu.label,
			url: menu.url && RouteHelper.withProjectId(menu.url, this.session.currentProjectId()),
		};
	}

	private fallbackLabelOf(menu: MenuItemModel): string | undefined {
		const fallback = menu.fallbackLabel;
		if (!fallback) return undefined;
		const restricted = CurrentUserHelper.hasUserAuthority(this.session.currentUser(), fallback.unlessAuthority);
		return restricted ? undefined : fallback.label;
	}

	private isPrefixOfCurrentPath(url: string): boolean {
		const path = url.replace(/^\//, '');
		return this.currentPath() === path || (path !== '' && this.currentPath().startsWith(`${path}/`));
	}

	private pathOf(url: string): string {
		return url.split(/[?#]/)[0].replace(/^\//, '');
	}
}
