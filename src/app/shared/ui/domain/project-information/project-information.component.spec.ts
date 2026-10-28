import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { SessionFacade } from '@core/registry/state/session.facade'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectInformationComponent } from './project-information.component'

interface Internals {
	optionLabels: () => string
	optionsRatio: () => string
	canEdit: () => boolean
	editUrl: () => string
}

const project: ProjectModel = {
	id: 'p1',
	name: 'Camp',
	options: [
		{ value: ProjectOptionEnum.VEHICLE, label: 'Véhicules' },
		{ value: ProjectOptionEnum.ALERT, label: 'Alertes' },
	],
} as unknown as ProjectModel

describe('ProjectInformationComponent', () => {
	let fixture: ComponentFixture<ProjectInformationComponent>
	let currentUser: WritableSignal<CurrentUserModel | undefined>

	const internals = (): Internals => fixture.componentInstance as unknown as Internals

	beforeEach(async () => {
		currentUser = signal({ authorities: [`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U}`] } as unknown as CurrentUserModel)
		await MockBuilder(ProjectInformationComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(DateFormatPipe, (value: string): string => value)
			.provide({ provide: SessionFacade, useValue: { selectedProject: signal(project), currentUser, currentProjectId: signal('p1') } })
			.provide(provideRouter([]))
		fixture = TestBed.createComponent(ProjectInformationComponent)
		await fixture.whenStable()
	})

	it('should join the labels of the project options', () => {
		// Arrange
		const expected: string = 'Véhicules · Alertes'

		// Act
		const labels: string = internals().optionLabels()

		// Assert
		expect(labels).toBe(expected)
	})

	it('should give the ratio of the selected options', () => {
		// Arrange
		const expected: string = '2/4'

		// Act
		const ratio: string = internals().optionsRatio()

		// Assert
		expect(ratio).toBe(expected)
	})

	it('should show the edit button when the user may edit the project', () => {
		// Arrange
		const selector: string = 'sgdf-button'

		// Act
		const button: Element | null = fixture.nativeElement.querySelector(selector)

		// Assert
		expect(button).not.toBeNull()
		expect(internals().editUrl()).toBe('/projects/p1/edit')
	})

	it('should hide the edit button without the edit authority', async () => {
		// Arrange
		currentUser.set({ authorities: [] } as unknown as CurrentUserModel)

		// Act
		await fixture.whenStable()

		// Assert
		expect(internals().canEdit()).toBe(false)
	})
})
