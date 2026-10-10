import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { signal, WritableSignal } from '@angular/core'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryComponent } from '@core/layout/registry.component'
import { UiFacade } from '@core/registry/state/ui.facade'
import { NotificationModel } from '@shared/models/model/notification.model'

describe('RegistryComponent', () => {
	let notifications: Subject<NotificationModel>
	let create: Mock
	let globalError: WritableSignal<NotificationModel | undefined>
	let fixture: ComponentFixture<RegistryComponent>

	beforeEach(async () => {
		notifications = new Subject<NotificationModel>()
		create = vi.fn()
		globalError = signal<NotificationModel | undefined>(undefined)
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{ provide: UiFacade, useValue: { notification: notifications.asObservable(), globalError } },
			],
		})
		fixture = TestBed.createComponent(RegistryComponent)
		await fixture.whenStable()
		fixture.nativeElement.querySelector('sgdf-toast').create = create
	})

	it('should show a translated notification with the variant of its severity', () => {
		// Arrange
		const notification: NotificationModel = { severity: 'error', summary: 'a.title', detail: 'a.message', life: 3000 }

		// Act
		notifications.next(notification)

		// Assert
		expect(create).toHaveBeenCalledWith('fr.a.message', { variant: 'danger', title: 'fr.a.title', duration: 3000 })
	})

	it('should keep a sticky notification until it is closed', () => {
		// Arrange
		const notification: NotificationModel = { severity: 'warn', summary: 'a.title', detail: 'a.message', sticky: true }

		// Act
		notifications.next(notification)

		// Assert
		expect(create).toHaveBeenCalledWith('fr.a.message', { variant: 'warning', title: 'fr.a.title', duration: 0 })
	})

	it('should fall back to the primary variant and empty texts', () => {
		// Arrange
		const notification: NotificationModel = { severity: 'unknown' }

		// Act
		notifications.next(notification)

		// Assert
		expect(create).toHaveBeenCalledWith('', { variant: 'primary', title: '', duration: undefined })
	})

	it('should keep the routed pages while there is no global error', () => {
		// Arrange
		const page: HTMLElement = fixture.nativeElement

		// Act
		const hasError: boolean = page.querySelector('app-global-error') !== null

		// Assert
		expect(hasError).toBe(false)
	})

	it('should replace the routed pages with the global error when the application is blocked', async () => {
		// Arrange
		globalError.set({ severity: 'error', summary: 'Down' })

		// Act
		await fixture.whenStable()

		// Assert
		expect(fixture.nativeElement.querySelector('app-global-error')).not.toBeNull()
		expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull()
	})
})
