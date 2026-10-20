import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { HomeFacade } from '@pages/home/data/state/home.facade'
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ProjectMapper } from '@shared/mappers/project.mapper'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { HomeAttentionProjectsComponent } from './home-attention-projects.component'

function alerted(activeAlerts: number, index: number): ProjectModel {
	const project: ProjectModel = ProjectMapper.toModel(PROJECT_DTO)
	return { ...project, id: `p${index}`, counts: { participants: 1, groups: 1, acceptedProfiles: 1, vehicles: undefined, activities: undefined, activeAlerts } }
}

describe('HomeAttentionProjectsComponent', () => {
	let fixture: ComponentFixture<HomeAttentionProjectsComponent>
	let attention: WritableSignal<ProjectModel[]>
	let loading: WritableSignal<boolean>
	let fetchAttention: ReturnType<typeof vi.fn>

	async function render(): Promise<void> {
		fixture = TestBed.createComponent(HomeAttentionProjectsComponent)
		await fixture.whenStable()
	}

	beforeEach(async () => {
		attention = signal<ProjectModel[]>([])
		loading = signal(false)
		fetchAttention = vi.fn()
		await MockBuilder(HomeAttentionProjectsComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.provide({
				provide: HomeFacade,
				useValue: { attention, attentionLoading: loading, attentionError: signal<NotificationModel | undefined>(undefined), fetchAttention },
			})
	})

	it('should load the projects when displayed', async () => {
		await render()

		expect(fetchAttention).toHaveBeenCalledTimes(1)
	})

	it('should list the projects with active alerts', async () => {
		// Arrange
		attention.set([alerted(3, 0), alerted(1, 1)])

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.querySelectorAll('a').length).toBe(2)
	})

	it('should use the danger variant from two alerts and the info variant below', async () => {
		// Arrange
		attention.set([alerted(2, 0), alerted(1, 1)])

		// Act
		await render()
		const variants: string[] = Array.from<Element>(fixture.nativeElement.querySelectorAll('a sgdf-tag')).map((tag: Element): string => tag.getAttribute('ng-reflect-variant') ?? (tag as unknown as { variant: string }).variant)

		// Assert
		expect(variants).toEqual(['danger', 'info'])
	})

	it('should tell that no project has an alert', async () => {
		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.textContent).toContain('home.attention.empty')
	})

	it('should show a skeleton while loading', async () => {
		// Arrange
		loading.set(true)

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-skeleton').length).toBe(3)
	})
})
