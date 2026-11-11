import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { AccountThemeComponent } from '@pages/my-account/account-theme/account-theme.component';
import { AccountThemeHarness } from '@pages/my-account/account-theme/testing/account-theme.harness';
import { THEME_CHOICES } from '@shared/helpers/theme-choices.const';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';

describe('AccountThemeComponent', () => {
	let update: Mock<(value: ThemeEnum) => void>;

	async function create(): Promise<AccountThemeHarness> {
		const fixture = TestBed.createComponent(AccountThemeComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AccountThemeHarness);
	}

	beforeEach(() => {
		update = vi.fn();
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{
					provide: SessionFacade,
					useValue: {
						currentUserTheme: signal(ThemeEnum.LIGHT),
						themeChoices: THEME_CHOICES,
						updateCurrentUserTheme: update,
					},
				},
			],
		});
	});

	it('frames the choices with the theme icon, title and hint', async () => {
		// Arrange
		const preference = await (await create()).preference();

		// Act
		const shown = [await preference.icon(), await preference.title(), await preference.hint()];

		// Assert
		expect(shown).toEqual(['palette', 'fr.myAccount.theme.title', 'fr.myAccount.theme.hint']);
	});

	it('offers every choice and marks the current one', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.choices(), await harness.value()];

		// Assert
		expect(shown).toEqual([
			THEME_CHOICES.map((choice) => ({ value: choice.theme, label: `fr.${choice.labelKey}` })),
			ThemeEnum.LIGHT,
		]);
	});

	it('hands the chosen theme to the session', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.choose(ThemeEnum.DARK);

		// Assert
		expect(update).toHaveBeenCalledWith(ThemeEnum.DARK);
	});
});
