import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { PrivacyPage } from '@pages/privacy/privacy.page';
import { LegalDocumentHarness } from '@shared/ui/common/legal-document/testing/legal-document.harness';

describe('PrivacyPage', () => {
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

	it('shows the privacy document with every section in order', async () => {
		// Arrange
		const harness = await TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(PrivacyPage),
			LegalDocumentHarness,
		);

		// Act
		const titles = (await harness.sections()).map((section) => section.title);

		// Assert
		expect([await harness.title(), titles.length, titles[0], titles.at(-1)]).toEqual([
			'fr.privacy.title',
			14,
			'fr.privacy.sections.controller.title',
			'fr.privacy.sections.changes.title',
		]);
	});
});
