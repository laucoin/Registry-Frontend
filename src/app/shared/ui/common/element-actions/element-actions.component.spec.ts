import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { MockBuilder } from 'ng-mocks'
import { Mock } from 'vitest'
import { ElementActionsComponent } from './element-actions.component'

describe('ElementActionsComponent', () => {
	let fixture: ComponentFixture<ElementActionsComponent>
	let run: Mock<() => void>
	let actions: ElementActionModel[]

	const items = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('sgdf-menu-item'))

	const render = async (shown: ElementActionModel[]): Promise<void> => {
		TestBed.overrideProvider(TranslocoService, { useValue: { translate: (key: string): string => key } })
		fixture = TestBed.createComponent(ElementActionsComponent)
		fixture.componentRef.setInput('actions', shown)
		await fixture.whenStable()
	}

	beforeEach(async () => {
		run = vi.fn<() => void>()
		actions = [
			{ id: 'edit', label: 'users.actions.edit', icon: 'pen', disabled: false, danger: false, run },
			{ id: 'delete', label: 'users.actions.delete', icon: 'trash', disabled: true, danger: true, run: vi.fn() },
		]
		await MockBuilder(ElementActionsComponent).mock(TranslocoPipe, (key: string): string => key)
	})

	it('should show one item per action with its translated label', async () => {
		// Arrange
		await render(actions)

		// Act
		const labels: (string | undefined)[] = items().map((item: HTMLElement): string | undefined => item.textContent?.trim())

		// Assert
		expect(labels).toEqual(['users.actions.edit', 'users.actions.delete'])
	})

	it('should mark the dangerous action and disable the unavailable one', async () => {
		// Arrange
		await render(actions)

		// Act
		const [edit, remove]: HTMLElement[] = items()

		// Assert
		expect(edit.getAttribute('variant')).not.toBe('danger')
		expect(remove.getAttribute('variant')).toBe('danger')
		expect((remove as HTMLElement & { disabled: boolean }).disabled).toBe(true)
	})

	it('should run the chosen action', async () => {
		// Arrange
		await render(actions)

		// Act
		items()[0].click()

		// Assert
		expect(run).toHaveBeenCalledTimes(1)
	})

	it('should show nothing without an action', async () => {
		// Arrange
		await render([])

		// Act
		const menu: Element | null = fixture.nativeElement.querySelector('sgdf-menu')

		// Assert
		expect(menu).toBeNull()
	})

	it('should name the menu trigger after the subject it acts on', async () => {
		// Arrange
		await render(actions)
		fixture.componentRef.setInput('subject', 'Ada')

		// Act
		await fixture.whenStable()

		// Assert
		expect(fixture.nativeElement.querySelector('sgdf-icon-button').label).toBe('global.menu.options : Ada')
	})
})
