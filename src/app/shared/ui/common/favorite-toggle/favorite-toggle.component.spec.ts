import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { FavoriteToggleComponent } from './favorite-toggle.component'

describe('FavoriteToggleComponent', () => {
	let fixture: ComponentFixture<FavoriteToggleComponent>

	async function render(favorite: boolean): Promise<HTMLElement> {
		fixture = TestBed.createComponent(FavoriteToggleComponent)
		fixture.componentRef.setInput('favorite', favorite)
		fixture.componentRef.setInput('name', 'Camp')
		await fixture.whenStable()
		return fixture.nativeElement.querySelector('sgdf-icon-button')
	}

	beforeEach(async () => {
		await MockBuilder(FavoriteToggleComponent).mock(TranslocoPipe, (key: string): string => key)
	})

	it('should show a filled amber star for a favorite', async () => {
		// Arrange

		// Act
		const button: HTMLElement = await render(true)

		// Assert
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect((button as unknown as { library: string }).library).toBe('solid')
		expect((button as unknown as { variant: string }).variant).toBe('warning')
		expect((button as unknown as { label: string }).label).toBe('global.favorite.remove')
	})

	it('should show an outlined neutral star otherwise', async () => {
		// Arrange

		// Act
		const button: HTMLElement = await render(false)

		// Assert
		expect(button.getAttribute('aria-pressed')).toBe('false')
		expect((button as unknown as { library: string }).library).toBe('regular')
		expect((button as unknown as { variant: string }).variant).toBe('neutral')
		expect((button as unknown as { label: string }).label).toBe('global.favorite.add')
	})

	it('should emit when the user clicks the star', async () => {
		// Arrange
		const button: HTMLElement = await render(false)
		const emitted: () => void = vi.fn()
		fixture.componentInstance.toggled.subscribe(emitted)

		// Act
		button.click()

		// Assert
		expect(emitted).toHaveBeenCalledTimes(1)
	})
})
