import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RegistryConfig } from '@core/config/registry.config'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { PrivacyPage } from '@pages/privacy/privacy.page'
import { beforeEach, describe, expect, it } from 'vitest'

describe('LoginPage', () => {
	function create(providerName: string | null, providerAddress: string | null): HTMLElement {
		RegistryConfig.config = {
			application: {
				organization: 'Org',
				creator: { name: 'Creator', email: 'creator@example.org' },
			},
		} as typeof RegistryConfig.config
		RegistryConfig.environment = { hosting: { providerName, providerAddress } } as typeof RegistryConfig.environment
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		})
		const fixture: ComponentFixture<PrivacyPage> = TestBed.createComponent(PrivacyPage)
		fixture.detectChanges()
		return fixture.nativeElement as HTMLElement
	}

	beforeEach(() => {
		TestBed.resetTestingModule()
	})

	it('renders the document with its title', () => {
		// Arrange
		const page: HTMLElement = create(null, null)

		// Act
		const title: string | undefined = page.querySelector('sgdf-page-title')?.textContent?.trim()

		// Assert
		expect(title).toContain('privacy.title')
	})

	it('renders the hosting provider clause when the provider is configured', () => {
		// Arrange
		const page: HTMLElement = create('Host', '1 rue de Paris')

		// Act
		const text: string = page.textContent ?? ''

		// Assert
		expect(text).toContain('lause')
		expect(text).not.toContain('allback')
	})

	it('renders the hosting fallback when no provider is configured', () => {
		// Arrange
		const page: HTMLElement = create(null, null)

		// Act
		const html: string = page.innerHTML

		// Assert
		expect(html).toContain('allback')
		expect(html).not.toContain('lause')
	})
})
