import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AccountRefreshComponent } from '@pages/my-account/account-refresh/account-refresh.component';
import { AccountRefreshHarness } from '@pages/my-account/account-refresh/testing/account-refresh.harness';
import { REFRESH_CHOICES } from '@shared/helpers/refresh/refresh-choices.const';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';

describe('AccountRefreshComponent', () => {
	let update: Mock<(value: RefreshModeEnum) => void>;
	let tinyScreen: WritableSignal<boolean>;

	async function create(): Promise<AccountRefreshHarness> {
		const fixture = TestBed.createComponent(AccountRefreshComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AccountRefreshHarness);
	}

	beforeEach(() => {
		update = vi.fn();
		tinyScreen = signal(false);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: UiFacade, useValue: { tinyScreen } },
				{
					provide: SessionFacade,
					useValue: {
						currentUserRefreshMode: signal(RefreshModeEnum.NORMAL),
						updateCurrentUserRefreshMode: update,
					},
				},
			],
		});
	});

	it('frames the choices with the refresh mode icon, title and hint', async () => {
		// Arrange
		const preference = await (await create()).preference();

		// Act
		const shown = [await preference.icon(), await preference.title(), await preference.hint()];

		// Assert
		expect(shown).toEqual(['rotate', 'fr.myAccount.refresh.title', 'fr.myAccount.refresh.hint']);
	});

	it('offers every choice and marks the current one', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.choices(), await harness.value()];

		// Assert
		expect(shown).toEqual([
			REFRESH_CHOICES.map((choice) => ({ value: choice.mode, label: `fr.${choice.labelKey}` })),
			RefreshModeEnum.NORMAL,
		]);
	});

	it('hands the chosen refresh mode to the session', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.choose(RefreshModeEnum.ECO);

		// Assert
		expect(update).toHaveBeenCalledWith(RefreshModeEnum.ECO);
	});

	it.each([
		{ name: 'side by side on a wide screen', tiny: false, expected: 'horizontal' },
		{ name: 'stacked on a small screen, where they would not fit side by side', tiny: true, expected: 'vertical' },
	])('lays the choices out $name', async ({ tiny, expected }) => {
		// Arrange
		tinyScreen.set(tiny);
		const harness = await create();

		// Act
		const orientation = await harness.orientation();

		// Assert
		expect(orientation).toBe(expected);
	});
});
