import { ComponentFixture, TestBed } from '@angular/core/testing'
import { GlobalErrorComponent } from '@core/layout/global-error/global-error.component'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { NotificationModel } from '@shared/models/model/notification.model'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

describe('GlobalErrorComponent', () => {
	let reloadApplication: Mock<() => void>
	let fixture: ComponentFixture<GlobalErrorComponent>

	function create(error: NotificationModel): HTMLElement {
		fixture = TestBed.createComponent(GlobalErrorComponent)
		fixture.componentRef.setInput('error', error)
		fixture.detectChanges()
		return fixture.nativeElement
	}

	beforeEach(() => {
		TestBed.resetTestingModule()
		reloadApplication = vi.fn()
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [{ provide: UiFacade, useValue: { reloadApplication } }],
		})
	})

	it('should show the title and the detail of the error in a danger callout', () => {
		// Arrange
		const error: NotificationModel = { summary: 'Service Unavailable', detail: 'The API cannot be reached' }

		// Act
		const text: string = create(error).querySelector('sgdf-callout')!.textContent ?? ''

		// Assert
		expect(text).toContain('The API cannot be reached')
		expect(fixture.nativeElement.querySelector('sgdf-callout').getAttribute('title')).toBe('Service Unavailable')
		expect(fixture.nativeElement.querySelector('sgdf-callout').getAttribute('variant')).toBe('danger')
	})

	it('should fall back to the unknown error message when the error has no detail', () => {
		// Arrange
		const error: NotificationModel = { summary: 'Down' }

		// Act
		const text: string = create(error).querySelector('sgdf-callout')!.textContent ?? ''

		// Assert
		expect(text).toContain('global.notifications.UNKNOWN_ERROR.message')
	})

	it('should fall back to the unknown error title when the error has no title', () => {
		// Arrange
		const error: NotificationModel = { detail: 'Boom' }

		// Act
		const title: string | null = create(error).querySelector('sgdf-callout')!.getAttribute('title')

		// Assert
		expect(title).toContain('global.notifications.UNKNOWN_ERROR.title')
	})

	it('should reload the application when the retry button is clicked', () => {
		// Arrange
		const retry: HTMLElement = create({ summary: 'Down' }).querySelector('sgdf-button')!

		// Act
		retry.click()

		// Assert
		expect(reloadApplication).toHaveBeenCalledTimes(1)
	})
})
