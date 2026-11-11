import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { TermsPage } from '@pages/terms/terms.page';
import { LegalDocumentHarness } from '@shared/ui/common/legal-document/testing/legal-document.harness';

describe('TermsPage', () => {
	beforeEach(() => {
		RegistryConfig.config = {
			application: { organization: 'Org', creator: { name: 'Creator', email: 'creator@example.org' } },
		} as typeof RegistryConfig.config;
		RegistryConfig.environment = {
			hosting: { providerName: null, providerAddress: null },
		} as typeof RegistryConfig.environment;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('shows the terms document with every section in order', async () => {
		// Arrange
		const harness = await TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(TermsPage),
			LegalDocumentHarness,
		);

		// Act
		const titles = (await harness.sections()).map((section) => section.title);

		// Assert
		expect([await harness.title(), titles.length, titles[0], titles.at(-1)]).toEqual([
			'fr.terms.title',
			16,
			'fr.terms.sections.publisher.title',
			'fr.terms.sections.contact.title',
		]);
	});
});
