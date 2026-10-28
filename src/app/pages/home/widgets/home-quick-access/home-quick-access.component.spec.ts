import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { RegistryConfig } from '@core/config/registry.config'
import { ConfigModel } from '@core/config/model/config.model'
import { SessionFacade } from '@core/registry/state/session.facade'
import { HomeQuickAccessComponent } from './home-quick-access.component'

describe('HomeQuickAccessComponent', () => {
	let fixture: ComponentFixture<HomeQuickAccessComponent>

	async function render(canReadUsers: boolean, documentationUrl?: string, issuesUrl?: string): Promise<void> {
		RegistryConfig.config = { application: { support: { documentationUrl, issuesUrl } } } as ConfigModel
		vi.spyOn(CurrentUserHelper, 'hasUserAuthority').mockReturnValue(canReadUsers)
		fixture = TestBed.createComponent(HomeQuickAccessComponent)
		await fixture.whenStable()
	}

	beforeEach(async () => {
		await MockBuilder(HomeQuickAccessComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SessionFacade, useValue: { currentUser: signal(undefined) } })
	})

	it('should offer every shortcut to a user who can read users', async () => {
		// Arrange

		// Act
		await render(true, 'https://doc.test', 'https://issues.test')

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-button').length).toBe(5)
	})

	it('should open the documentation from the configuration in a new tab', async () => {
		// Arrange

		// Act
		await render(false, 'https://doc.test')
		const help: HTMLElement = fixture.nativeElement.querySelector('sgdf-button[target="_blank"]')

		// Assert
		expect(help.textContent).toContain('home.quickAccess.help')
		expect(help.getAttribute('ng-reflect-href') ?? (help as unknown as { href: string }).href).toBe('https://doc.test')
	})

	it('should open the support link from the configuration in a new tab', async () => {
		// Arrange

		// Act
		await render(false, undefined, 'https://issues.test')
		const support: HTMLElement = fixture.nativeElement.querySelector('sgdf-button[target="_blank"]')

		// Assert
		expect(support.textContent).toContain('home.quickAccess.support')
		expect(support.getAttribute('ng-reflect-href') ?? (support as unknown as { href: string }).href).toBe('https://issues.test')
	})

	it('should hide the support link when no issues url is configured', async () => {
		// Arrange

		// Act
		await render(true, 'https://doc.test')

		// Assert
		expect(fixture.nativeElement.textContent).not.toContain('home.quickAccess.support')
	})

	it('should hide the documentation link when no documentation url is configured', async () => {
		// Arrange

		// Act
		await render(true)

		// Assert
		expect(fixture.nativeElement.textContent).not.toContain('home.quickAccess.help')
	})

	it('should hide the users shortcut from a user who cannot read users', async () => {
		// Arrange

		// Act
		await render(false, 'https://doc.test')

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-button').length).toBe(3)
		expect(fixture.nativeElement.textContent).not.toContain('home.quickAccess.users')
	})
})
