import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { NavigationEnd, Router } from '@angular/router'
import { MenuItemModel } from '@core/layout/data/model/menu-item.model'
import { MenuService } from '@core/layout/data/service/menu.service'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { MockProvider } from 'ng-mocks'
import { Subject } from 'rxjs'
import { beforeEach, describe, expect, it } from 'vitest'

describe('MenuService', () => {
	let service: MenuService
	let currentUser: WritableSignal<CurrentUserModel | undefined>
	let selectedProject: WritableSignal<ProjectModel | undefined>
	let currentProjectId: WritableSignal<string | undefined>
	let routerEvents: Subject<unknown>
	let routerUrl: string

	const userWith = (...authorities: string[]): CurrentUserModel => ({ authorities } as unknown as CurrentUserModel)
	const projectWith = (...options: ProjectOptionEnum[]): ProjectModel => ({
		id: 'p1',
		options: options.map((value: ProjectOptionEnum) => ({ value })),
	} as unknown as ProjectModel)
	const labels = (menus: MenuItemModel[]): string[] => menus.map((menu: MenuItemModel): string => menu.label)

	beforeEach(() => {
		currentUser = signal<CurrentUserModel | undefined>(undefined)
		selectedProject = signal<ProjectModel | undefined>(undefined)
		currentProjectId = signal<string | undefined>(undefined)
		routerEvents = new Subject<unknown>()
		routerUrl = '/projects'
		TestBed.configureTestingModule({
			providers: [
				MockProvider(Router, {
					events: routerEvents, get url(): string {
						return routerUrl
					}
				} as unknown as Router),
				MockProvider(SessionFacade, { currentUser, selectedProject, currentProjectId }),
			],
		})
		service = TestBed.inject(MenuService)
	})

	it('should expose no menu when nobody is signed in', () => {
		// Arrange
		currentUser.set(undefined)

		// Act
		const menus: MenuItemModel[] = service.appMenus()

		// Assert
		expect(menus).toEqual([])
		expect(service.projectMenus()).toEqual([])
	})

	it('should hide the users menu without the users authority', () => {
		// Arrange
		currentUser.set(userWith())

		// Act
		const menus: MenuItemModel[] = service.appMenus()

		// Assert
		expect(labels(menus)).toEqual(['global.menu.projects'])
	})

	it('should show the users menu with the users authority', () => {
		// Arrange
		currentUser.set(userWith(UserAuthorityEnum.REGISTRY_USER_R))

		// Act
		const menus: MenuItemModel[] = service.appMenus()

		// Assert
		expect(labels(menus)).toEqual(['global.menu.projects', 'global.menu.users'])
	})

	it('should expose no project menu without a selected project', () => {
		// Arrange
		currentUser.set(userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`))

		// Act
		const menus: MenuItemModel[] = service.projectMenus()

		// Assert
		expect(menus).toEqual([])
	})

	it('should filter the project menus by authority and build their urls', () => {
		// Arrange
		currentUser.set(userWith(
			`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`,
			`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_R}`,
		))
		selectedProject.set(projectWith())
		currentProjectId.set('p1')

		// Act
		const menus: MenuItemModel[] = service.projectMenus()

		// Assert
		expect(labels(menus)).toEqual(['global.menu.project-home', 'global.menu.movements'])
		expect(menus[1]!.url).toBe('projects/p1/movements')
	})

	it('should hide the menus of a project option the project does not have', () => {
		// Arrange
		currentUser.set(userWith(
			`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`,
			`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R}`,
		))
		selectedProject.set(projectWith())
		currentProjectId.set('p1')

		// Act
		const withoutOption: string[] = labels(service.projectMenus())
		selectedProject.set(projectWith(ProjectOptionEnum.ALERT))
		const withOption: string[] = labels(service.projectMenus())

		// Assert
		expect(withoutOption).not.toContain('global.menu.alerts')
		expect(withOption).toContain('global.menu.alerts')
	})

	it('should keep only the allowed entries of the configuration menu', () => {
		// Arrange
		currentUser.set(userWith(
			`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`,
			`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R}`,
		))
		selectedProject.set(projectWith())
		currentProjectId.set('p1')

		// Act
		const configuration: MenuItemModel | undefined = service.projectMenus()
			.find((menu: MenuItemModel): boolean => menu.label == 'global.menu.configuration')

		// Assert
		expect(labels(configuration?.items ?? [])).toEqual(['global.menu.groups'])
	})

	it('should drop the configuration menu when none of its entries is allowed', () => {
		// Arrange
		currentUser.set(userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`))
		selectedProject.set(projectWith())
		currentProjectId.set('p1')

		// Act
		const menus: string[] = labels(service.projectMenus())

		// Assert
		expect(menus).not.toContain('global.menu.configuration')
	})

	describe('activeMenuUrl', () => {
		const navigateTo = (url: string): void => {
			routerUrl = url
			routerEvents.next(new NavigationEnd(1, url, url))
		}
		const signInOnProject = (): void => {
			currentUser.set(userWith(
				UserAuthorityEnum.REGISTRY_USER_R,
				`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`,
				`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R}`,
			))
			selectedProject.set(projectWith())
			currentProjectId.set('p1')
		}

		it('should match the url the router starts on', () => {
			// Arrange
			routerUrl = '/projects'
			currentUser.set(userWith())

			// Act
			const active: string | undefined = TestBed.inject(MenuService).activeMenuUrl()

			// Assert
			expect(active).toBe('projects')
		})

		it('should prefer the most specific menu over the project home', () => {
			// Arrange
			signInOnProject()
			const freshService: MenuService = TestBed.inject(MenuService)

			// Act
			navigateTo('/projects/p1/configuration/groups/3/edit?tab=1#top')

			// Assert
			expect(freshService.activeMenuUrl()).toBe('projects/p1/configuration/groups')
		})

		it('should match the project home on the project root', () => {
			// Arrange
			signInOnProject()
			const freshService: MenuService = TestBed.inject(MenuService)

			// Act
			navigateTo('/projects/p1')

			// Assert
			expect(freshService.activeMenuUrl()).toBe('projects/p1')
		})

		it('should not match a menu whose url only shares a text prefix', () => {
			// Arrange
			signInOnProject()
			const freshService: MenuService = TestBed.inject(MenuService)

			// Act
			navigateTo('/usersettings')

			// Assert
			expect(freshService.activeMenuUrl()).toBeUndefined()
		})

		it('should resolve the menu urls with the current project id', () => {
			// Arrange
			signInOnProject()
			const freshService: MenuService = TestBed.inject(MenuService)
			navigateTo('/projects/p1/movements')

			// Act
			currentProjectId.set('p2')
			navigateTo('/projects/p2')

			// Assert
			expect(freshService.activeMenuUrl()).toBe('projects/p2')
		})
	})
})
