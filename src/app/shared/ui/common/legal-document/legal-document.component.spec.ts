import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { LegalDocumentHelper } from '@shared/helpers/legal-document.helper';
import { LegalBlockKindEnum } from '@shared/models/enumeration/legal-block-kind.enum';
import { LegalDocumentComponent } from '@shared/ui/common/legal-document/legal-document.component';
import { LegalDocumentHarness } from '@shared/ui/common/legal-document/testing/legal-document.harness';

const TRANSLATIONS = {
	doc: {
		title: 'Document',
		updatedAt: 'Updated {{ updatedAt }}',
		intro: ['Hello {{ organizationName }}', 'Second'],
		sections: {
			plain: { title: 'Plain', body: ['By {{ creatorName }}'] },
			listed: { title: 'Listed', body: ['Items'], list: ['<b>One</b>', 'Two'] },
			hosting: {
				title: 'Hosting',
				line: 'Write to {{ creatorEmail }}',
				clause: 'Hosted by {{ providerName }}, {{ providerAddress }}',
				fallback: 'Self hosted by {{ organizationName }}',
			},
		},
	},
};

const SECTIONS = [
	LegalDocumentHelper.section('doc', 'plain'),
	LegalDocumentHelper.section('doc', 'listed', true),
	LegalDocumentHelper.custom('doc', 'hosting', [
		{ kind: LegalBlockKindEnum.LINE, key: 'doc.sections.hosting.line' },
		{
			kind: LegalBlockKindEnum.HOSTING,
			key: 'doc.sections.hosting.clause',
			fallbackKey: 'doc.sections.hosting.fallback',
		},
	]),
];

describe('LegalDocumentComponent', () => {
	function create(providerName: string | null, providerAddress: string | null): Promise<LegalDocumentHarness> {
		RegistryConfig.environment = {
			hosting: { providerName, providerAddress },
		} as typeof RegistryConfig.environment;
		const fixture = TestBed.createComponent(LegalDocumentComponent);
		fixture.componentRef.setInput('prefix', 'doc');
		fixture.componentRef.setInput('updatedAt', '2024-10-09');
		fixture.componentRef.setInput('sections', SECTIONS);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, LegalDocumentHarness);
	}

	beforeEach(() => {
		RegistryConfig.config = {
			application: { organization: 'Org', creator: { name: 'Creator', email: 'creator@example.org' } },
		} as typeof RegistryConfig.config;
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: TRANSLATIONS },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
		});
	});

	it('titles the document with its update date and introduces it with the organization', async () => {
		// Arrange
		const harness = await create(null, null);

		// Act
		const shown = [await harness.title(), await harness.lede(), await harness.introParagraphs()];

		// Assert
		expect(shown).toEqual([
			'Document',
			`Updated ${new Date('2024-10-09').toLocaleDateString()}`,
			['Hello Org', 'Second'],
		]);
	});

	it('renders each section with its paragraphs, list and lines', async () => {
		// Arrange
		const harness = await create(null, null);

		// Act
		const sections = await harness.sections();

		// Assert
		expect(sections).toEqual([
			{ title: 'Plain', texts: ['By Creator'] },
			{ title: 'Listed', texts: ['Items', 'One', 'Two'] },
			{ title: 'Hosting', texts: ['Write to creator@example.org', 'Self hosted by Org'] },
		]);
	});

	it.each([
		{
			name: 'the fallback without a provider',
			provider: [null, null],
			expected: { clause: undefined, fallback: 'Self hosted by Org' },
		},
		{
			name: 'the fallback with a partial provider',
			provider: ['Host', null],
			expected: { clause: undefined, fallback: 'Self hosted by Org' },
		},
		{
			name: 'the clause of a configured provider',
			provider: ['Host', '1 rue de Paris'],
			expected: { clause: 'Hosted by Host, 1 rue de Paris', fallback: undefined },
		},
	])('shows $name', async ({ provider, expected }) => {
		// Arrange
		const harness = await create(provider[0], provider[1]);

		// Act
		const hosting = await harness.hostingText();

		// Assert
		expect(hosting).toEqual(expected);
	});
});
