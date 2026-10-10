import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryComponent } from '@core/layout/registry.component'
import { UiFacade } from '@core/registry/state/ui.facade'
import { NotificationModel } from '@shared/models/model/notification.model'

describe('RegistryComponent', () => {
	let notifications: Subject<NotificationModel>
	let create: Mock
	let fixture: ComponentFixture<RegistryComponent>

	beforeEach(async () => {
		notifications = new Subject<NotificationModel>()
		create = vi.fn()
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				{ provide: UiFacade, useValue: { notification: notifications.asObservable() } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
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
		expect(create).toHaveBeenCalledWith('t:a.message', { variant: 'danger', title: 't:a.title', duration: 3000 })
	})

	it('should keep a sticky notification until it is closed', () => {
		// Arrange
		const notification: NotificationModel = { severity: 'warn', summary: 'a.title', detail: 'a.message', sticky: true }

		// Act
		notifications.next(notification)

		// Assert
		expect(create).toHaveBeenCalledWith('t:a.message', { variant: 'warning', title: 't:a.title', duration: 0 })
	})

	it('should fall back to the primary variant and empty texts', () => {
		// Arrange
		const notification: NotificationModel = { severity: 'unknown' }

		// Act
		notifications.next(notification)

		// Assert
		expect(create).toHaveBeenCalledWith('', { variant: 'primary', title: '', duration: undefined })
	})
})
