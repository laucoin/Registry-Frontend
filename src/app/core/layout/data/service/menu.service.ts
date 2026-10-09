import { computed, inject, Injectable, Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { APP_LEVEL_MENUS, PROJECT_LEVEL_MENUS } from '@core/layout/data/menu.definitions'
import { MenuItemModel } from '@core/layout/data/model/menu-item.model'
import { SessionFacade } from '@core/registry/state/session.facade'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { filter, map, startWith } from 'rxjs'

/**
 * Purpose: Gives the navigation menus the signed-in user is allowed to see.
 * Scope: Filters the menu definitions by the user authorities and the project options, resolves the project urls and finds the menu matching the current url.
 * Limits: Filters for display only; the backend is the security boundary.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
	private readonly session: SessionFacade = inject(SessionFacade)
	private readonly router: Router = inject(Router)
	private readonly currentPath: Signal<string> = toSignal(
		this.router.events.pipe(
			filter((event: unknown): boolean => event instanceof NavigationEnd),
			map((): string => this.pathOf(this.router.url)),
			startWith(this.pathOf(this.router.url)),
		),
		{ requireSync: true },
	)

	public readonly appMenus: Signal<MenuItemModel[]> = computed((): MenuItemModel[] =>
		this.filterMenus(APP_LEVEL_MENUS),
	)

	public readonly projectMenus: Signal<MenuItemModel[]> = computed((): MenuItemModel[] =>
		this.filterMenus(PROJECT_LEVEL_MENUS),
	)

	public readonly activeMenuUrl: Signal<string | undefined> = computed((): string | undefined =>
		this.flatten([...this.appMenus(), ...this.projectMenus()])
			.map((menu: MenuItemModel): string | undefined => menu.url)
			.filter((url: string | undefined): url is string => !!url && this.isPrefixOfCurrentPath(url))
			.sort((first: string, second: string): number => second.length - first.length)[0],
	)

	private filterMenus(menus: MenuItemModel[]): MenuItemModel[] {
		const currentUser: CurrentUserModel | undefined = this.session.currentUser()
		const project: ProjectModel | undefined = this.session.selectedProject()

		return menus
			.filter((menu: MenuItemModel): boolean => CurrentUserHelper.isFeasible(currentUser, project, menu))
			.map((menu: MenuItemModel): MenuItemModel => this.resolve(menu))
			.filter((menu: MenuItemModel): boolean => !menu.items || menu.items.length > 0)
	}

	private resolve(menu: MenuItemModel): MenuItemModel {
		return {
			...menu,
			url: menu.url?.replace(':projectId', this.session.currentProjectId() ?? ''),
			items: menu.items && this.filterMenus(menu.items),
		}
	}

	private flatten(menus: MenuItemModel[]): MenuItemModel[] {
		return menus.flatMap((menu: MenuItemModel): MenuItemModel[] => [menu, ...this.flatten(menu.items ?? [])])
	}

	private isPrefixOfCurrentPath(url: string): boolean {
		return this.currentPath() === url || this.currentPath().startsWith(`${url}/`)
	}

	private pathOf(url: string): string {
		return url.split(/[?#]/)[0]!.replace(/^\//, '')
	}
}
