import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { LoginPage } from '@pages/login/login.page'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

describe('LoginPage', () => {
	let login: Mock<() => void>
	let fixture: ComponentFixture<LoginPage>

	beforeEach(() => {
		TestBed.resetTestingModule()
		login = vi.fn()
		RegistryConfig.config = {
			application: { name: 'Registry', organization: 'Org' },
		} as typeof RegistryConfig.config
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [provideRouter([]), { provide: SessionFacade, useValue: { login } }],
		})
		fixture = TestBed.createComponent(LoginPage)
		fixture.detectChanges()
	})

	it('renders the login title', () => {
		// Arrange
		const page: HTMLElement = fixture.nativeElement

		// Act
		const title: string | undefined = page.querySelector('sgdf-page-title')?.textContent?.trim()

		// Assert
		expect(title).toContain('login.title')
	})

	it('starts the sign-in when the button is clicked', () => {
		// Arrange
		const button: HTMLElement = fixture.nativeElement.querySelector('sgdf-button')

		// Act
		button.click()

		// Assert
		expect(login).toHaveBeenCalledTimes(1)
	})

	it('links to the terms and privacy pages', () => {
		// Arrange
		const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'))

		// Act
		const hrefs: string[] = links.map((link: HTMLAnchorElement): string => link.getAttribute('href') ?? '')

		// Assert
		expect(hrefs).toEqual(['/terms', '/privacy'])
	})
})
