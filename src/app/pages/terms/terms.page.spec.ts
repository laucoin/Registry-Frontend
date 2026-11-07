import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { TermsPage } from '@pages/terms/terms.page';

describe('TermsPage', () => {
	function create(providerName: string | null, providerAddress: string | null): HTMLElement {
		RegistryConfig.config = {
			application: {
				organization: 'Org',
				creator: { name: 'Creator', email: 'creator@example.org' },
			},
		} as typeof RegistryConfig.config;
		RegistryConfig.environment = {
			hosting: { providerName, providerAddress },
		} as typeof RegistryConfig.environment;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
		const fixture = TestBed.createComponent(TermsPage);
		fixture.detectChanges();
		return fixture.nativeElement as HTMLElement;
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('renders the document with its title', () => {
		// Arrange
		const page = create(null, null);

		// Act
		const title = page.querySelector('sgdf-page-title')?.textContent?.trim();

		// Assert
		expect(title).toContain('terms.title');
	});

	it('renders the hosting provider clause when the provider is configured', () => {
		// Arrange
		const page = create('Host', '1 rue de Paris');

		// Act
		const text = page.textContent ?? '';

		// Assert
		expect(text).toContain('lause');
		expect(text).not.toContain('allback');
	});

	it('renders the hosting fallback when no provider is configured', () => {
		// Arrange
		const page = create(null, null);

		// Act
		const html = page.innerHTML;

		// Assert
		expect(html).toContain('allback');
		expect(html).not.toContain('lause');
	});
});
