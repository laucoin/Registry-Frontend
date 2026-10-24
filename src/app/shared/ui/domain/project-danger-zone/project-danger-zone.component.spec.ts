import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectDangerZoneComponent } from '@shared/ui/domain/project-danger-zone/project-danger-zone.component'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface DangerZoneInternals {
	shown: () => boolean
	canDisable: () => boolean
	canEnable: () => boolean
	canDelete: () => boolean
	delete: () => void
}

describe('ProjectDangerZoneComponent', () => {
	let currentUser: WritableSignal<CurrentUserModel | undefined>
	let selectedProject: WritableSignal<ProjectModel | undefined>
	const confirm: ReturnType<typeof vi.fn> = vi.fn()
	const deleteProject: ReturnType<typeof vi.fn> = vi.fn()

	const userWith = (...authorities: ProjectAuthorityEnum[]): CurrentUserModel =>
		({ authorities: authorities.map((authority: ProjectAuthorityEnum): string => `p1_${authority}`) }) as unknown as CurrentUserModel
	const create = (): DangerZoneInternals => TestBed.createComponent(ProjectDangerZoneComponent).componentInstance as unknown as DangerZoneInternals

	beforeEach(() => {
		confirm.mockReset()
		deleteProject.mockReset()
		currentUser = signal(undefined)
		selectedProject = signal({ id: 'p1', name: 'Camp', visible: true } as unknown as ProjectModel)
		TestBed.configureTestingModule({
			imports: [ProjectDangerZoneComponent, TranslocoTestingModule.forRoot({ langs: {}, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: { currentUser, selectedProject, currentProjectId: signal('p1') } },
				{ provide: ProjectFacade, useValue: { deleteProject, disableProject: vi.fn(), enableProject: vi.fn() } },
				{ provide: ElementConfirmationService, useValue: { confirm } },
			],
		})
	})

	it('should show nothing without any authority', () => {
		// Arrange
		currentUser.set(userWith())

		// Act & Assert
		expect(create().shown()).toBe(false)
	})

	it('should offer to hide a visible project and to show a hidden one', () => {
		// Arrange
		currentUser.set(userWith(ProjectAuthorityEnum.REGISTRY_PROJECT_U, ProjectAuthorityEnum.REGISTRY_PROJECT_D))

		// Act
		const component: DangerZoneInternals = create()

		// Assert
		expect([component.canDisable(), component.canEnable()]).toEqual([true, false])
		selectedProject.set({ id: 'p1', name: 'Camp', visible: false } as unknown as ProjectModel)
		expect([component.canDisable(), component.canEnable()]).toEqual([false, true])
	})

	it('should ask a typed confirmation before deleting the project', () => {
		// Arrange
		currentUser.set(userWith(ProjectAuthorityEnum.REGISTRY_PROJECT_D))
		const component: DangerZoneInternals = create()

		// Act
		component.delete()
		const accept: () => void = confirm.mock.calls[0][4]
		accept()

		// Assert
		expect(confirm.mock.calls[0][0]).toBe('projects.actions.confirmations.delete')
		expect(confirm.mock.calls[0][2]).toBe(SeverityEnum.DANGER)
		expect(confirm.mock.calls[0][5]).toBe(true)
		expect(deleteProject).toHaveBeenCalledWith(selectedProject())
	})
})
