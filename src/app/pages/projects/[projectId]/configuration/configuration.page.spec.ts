import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { ConfigurationPage } from '@pages/projects/[projectId]/configuration/configuration.page'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { DatePipe } from '@angular/common'
import { describe, expect, it, beforeEach } from 'vitest'

interface ConfigurationPageInternals {
	tiles: () => { key: string, url: string }[]
	countOf: (tile: { count: string }) => number | undefined
}

describe('ConfigurationPage', () => {
	let currentUser: WritableSignal<CurrentUserModel | undefined>
	let selectedProject: WritableSignal<ProjectModel | undefined>

	const userWith = (...authorities: string[]): CurrentUserModel => ({ authorities }) as unknown as CurrentUserModel
	const projectWith = (options: ProjectOptionEnum[], counts?: ProjectModel['counts']): ProjectModel => ({
		id: 'p1',
		name: 'Camp',
		options: options.map((value: ProjectOptionEnum) => ({ value, label: value })),
		counts,
	}) as unknown as ProjectModel
	const create = (): ConfigurationPageInternals => TestBed.createComponent(ConfigurationPage).componentInstance as unknown as ConfigurationPageInternals

	beforeEach(() => {
		currentUser = signal(undefined)
		selectedProject = signal(undefined)
		TestBed.configureTestingModule({
			imports: [ConfigurationPage, TranslocoTestingModule.forRoot({ langs: {}, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				DatePipe,
				{
					provide: SessionFacade,
					useValue: { currentUser, selectedProject, currentProjectId: signal('p1') },
				},
			],
		})
	})

	it('should list only the tiles the user is allowed to open', () => {
		// Arrange
		currentUser.set(userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R}`, `p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_R}`))
		selectedProject.set(projectWith([]))

		// Act
		const keys: string[] = create().tiles().map((tile: { key: string }): string => tile.key)

		// Assert
		expect(keys).toEqual(['participants', 'groups'])
	})

	it('should hide the tiles of the options the project does not have', () => {
		// Arrange
		currentUser.set(userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_R}`, `p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_R}`))
		selectedProject.set(projectWith([ProjectOptionEnum.VEHICLE]))

		// Act
		const keys: string[] = create().tiles().map((tile: { key: string }): string => tile.key)

		// Assert
		expect(keys).toEqual(['vehicles'])
	})

	it('should read the count of a tile from the project counts', () => {
		// Arrange
		selectedProject.set(projectWith([], { participants: 15, groups: 7, acceptedProfiles: 6, vehicles: undefined, activities: undefined, activeAlerts: undefined }))
		const page: ConfigurationPageInternals = create()

		// Act
		const profiles: number | undefined = page.countOf({ count: 'acceptedProfiles' })
		const vehicles: number | undefined = page.countOf({ count: 'vehicles' })

		// Assert
		expect(profiles).toBe(6)
		expect(vehicles).toBeUndefined()
	})

	it('should resolve the tile urls with the current project id', () => {
		// Arrange
		currentUser.set(userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R}`))
		selectedProject.set(projectWith([]))

		// Act
		const urls: string[] = create().tiles().map((tile: { url: string }): string => tile.url)

		// Assert
		expect(urls).toEqual(['/projects/p1/configuration/groups'])
	})
})
