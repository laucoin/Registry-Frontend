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

	it('should show the title and the detail of the error as its cause', () => {
		// Arrange
		const error: NotificationModel = { summary: 'Service Unavailable', detail: 'The API cannot be reached' }

		// Act
		const text: string = create(error).querySelector('[role="alert"]')!.textContent ?? ''

		// Assert
		expect(text).toContain('Service Unavailable')
		expect(text).toContain('The API cannot be reached')
	})

	it('should omit the cause lines the error does not provide', () => {
		// Arrange
		const error: NotificationModel = { summary: 'Down' }

		// Act
		const page: HTMLElement = create(error)

		// Assert
		expect(page.querySelectorAll('strong')).toHaveLength(1)
		expect(page.querySelectorAll('span')).toHaveLength(0)
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
