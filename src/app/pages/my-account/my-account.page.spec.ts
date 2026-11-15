import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { MyAccountPage } from '@pages/my-account/my-account.page';
import { MyAccountHarness } from '@pages/my-account/testing/my-account.harness';
import { THEME_CHOICES } from '@shared/helpers/theme-choices.const';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';

describe('MyAccountPage', () => {
	beforeEach(() => {
		RegistryConfig.config = { application: { organization: 'SGDF' } } as typeof RegistryConfig.config;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal(undefined),
						availableLanguages: ['fr', 'en'],
						currentUserLanguage: signal('fr'),
						pendingLanguage: signal(undefined),
						themeChoices: THEME_CHOICES,
						currentUserTheme: signal(ThemeEnum.SYSTEM),
						currentUserRefreshMode: signal(RefreshModeEnum.NORMAL),
						pendingAccountAction: signal(undefined),
						exportAccount: vi.fn(),
						deleteAccount: vi.fn(),
					},
				},
			],
		});
	});

	it('titles the page and composes the account sections', async () => {
		// Arrange
		const harness = await TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(MyAccountPage),
			MyAccountHarness,
		);

		// Act
		const titles = [
			await harness.title(),
			await (await harness.language()).preference().then((preference) => preference.title()),
			await (await harness.theme()).preference().then((preference) => preference.title()),
			await (await harness.refresh()).preference().then((preference) => preference.title()),
			await (await harness.personalData()).title(),
			(await (await harness.info()).title()).trim(),
		];

		// Assert
		expect(titles).toEqual([
			'fr.myAccount.title',
			'fr.myAccount.language.title',
			'fr.myAccount.theme.title',
			'fr.myAccount.refresh.title',
			'fr.myAccount.personalData.title',
			'fr.myAccount.info.title',
		]);
	});
});
