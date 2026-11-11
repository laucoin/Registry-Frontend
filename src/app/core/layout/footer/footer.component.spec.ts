import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { FooterComponent } from '@core/layout/footer/footer.component';
import { FooterHarness, FooterLinkEnum } from '@core/layout/footer/testing/footer.harness';
import { UiFacade } from '@core/registry/state/ui.facade';

interface FooterSetup {
	issuesUrl?: string;
	documentationUrl?: string;
	website?: string;
	version?: string;
	tinyScreen?: boolean;
}

describe('FooterComponent', () => {
	async function create(setup: FooterSetup = {}): Promise<FooterHarness> {
		RegistryConfig.config = {
			application: {
				name: 'Registry',
				organization: 'Org',
				version: setup.version,
				creator: { name: 'Creator', email: 'creator@example.org', website: setup.website ?? '' },
				support: { issuesUrl: setup.issuesUrl, documentationUrl: setup.documentationUrl },
			},
		} as typeof RegistryConfig.config;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{ provide: UiFacade, useValue: { tinyScreen: signal(setup.tinyScreen ?? false) } },
			],
		});
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(FooterComponent), FooterHarness);
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('links the privacy policy and the terms to their internal routes', async () => {
		// Arrange
		const footer = await create();

		// Act
		const hrefs = [
			(await footer.link(FooterLinkEnum.PRIVACY))?.href,
			(await footer.link(FooterLinkEnum.TERMS))?.href,
		];

		// Assert
		expect(hrefs).toEqual(['/privacy', '/terms']);
	});

	it.each<[string, FooterLinkEnum, FooterSetup, string]>([
		['creator', FooterLinkEnum.CREATOR, { website: 'https://example.org' }, 'https://example.org'],
		[
			'documentation',
			FooterLinkEnum.DOCUMENTATION,
			{ documentationUrl: 'https://doc.example.org' },
			'https://doc.example.org',
		],
		['support', FooterLinkEnum.SUPPORT, { issuesUrl: 'https://example.org/issues' }, 'https://example.org/issues'],
	])('opens the %s link in a new tab and announces it', async (_label, name, setup, href) => {
		// Arrange
		const footer = await create(setup);

		// Act
		const link = await footer.link(name);

		// Assert
		expect(link).toEqual({
			href,
			target: '_blank',
			rel: 'noopener noreferrer',
			newTabHint: '(fr.footer.new-tab)',
		});
	});

	it('shows the creator as plain text and hides the optional links when nothing is configured', async () => {
		// Arrange
		const footer = await create();

		// Act
		const links = await Promise.all([
			footer.link(FooterLinkEnum.CREATOR),
			footer.link(FooterLinkEnum.DOCUMENTATION),
			footer.link(FooterLinkEnum.SUPPORT),
		]);

		// Assert
		expect(links).toEqual([null, null, null]);
	});

	it.each([
		['known', '1.7.0', 'fr.footer.version'],
		['unknown', undefined, null],
	])('shows the version of the application only when it is %s', async (_label, version, expected) => {
		// Arrange
		const footer = await create({ version });

		// Act
		const shown = await footer.version();

		// Assert
		expect(shown).toBe(expected);
	});

	it.each([
		['wide', false, true],
		['tiny', true, false],
	])('draws the torn edge only on a %s screen', async (_label, tinyScreen, torn) => {
		// Arrange
		const footer = await create({ tinyScreen });

		// Act
		const shown = await footer.isTorn();

		// Assert
		expect(shown).toBe(torn);
	});
});
