import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { MenuService } from '@core/layout/data/service/menu.service';
import { MainComponent } from '@core/layout/main/main.component';
import { MainHarness } from '@core/layout/main/testing/main.harness';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';

describe('MainComponent', () => {
	let harness: MainHarness;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		RegistryConfig.config = {
			application: { name: 'Registry', organization: 'Org', creator: { name: 'Creator' }, support: {} },
		} as typeof RegistryConfig.config;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{
					provide: MenuService,
					useValue: {
						activeMenuUrl: signal(undefined),
						appMenus: signal([]),
						userMenus: signal([]),
						projectMenus: signal([]),
						logoutMenu: { label: 'logout' },
					},
				},
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal(undefined),
						selectedProject: signal(undefined),
						currentProjectId: signal(undefined),
						logout: vi.fn(),
					},
				},
			],
		});
		harness = await TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(MainComponent),
			MainHarness,
		);
	});

	it('should frame the routed page between the navbar and the footer', async () => {
		// Arrange
		const shell = harness;

		// Act
		const parts = [await shell.hasNavbar(), await shell.hostsRoutedPage(), await shell.hasFooter()];

		// Assert
		expect(parts).toEqual([true, true, true]);
	});

	it('should move the focus to the content when the skip link is used', async () => {
		// Arrange
		const before = await harness.isContentFocused();

		// Act
		await harness.skipToContent();

		// Assert
		expect(before).toBe(false);
		expect(await harness.isContentFocused()).toBe(true);
	});
});
