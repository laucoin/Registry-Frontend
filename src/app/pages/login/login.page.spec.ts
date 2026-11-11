import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { LoginPage } from '@pages/login/login.page';
import { LoginHarness } from '@pages/login/testing/login.harness';

describe('LoginPage', () => {
	let login: Mock<() => void>;

	async function create(): Promise<LoginHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(LoginPage), LoginHarness);
	}

	beforeEach(() => {
		login = vi.fn();
		RegistryConfig.config = {
			application: { name: 'Registry', organization: 'Org' },
		} as typeof RegistryConfig.config;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [provideRouter([]), { provide: SessionFacade, useValue: { login } }],
		});
	});

	it('titles the page and links to the terms and privacy pages', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.title(), await harness.legalLinks()];

		// Assert
		expect(shown).toEqual(['fr.login.title', ['/terms', '/privacy']]);
	});

	it('offers to sign in while nothing is in progress', async () => {
		// Arrange
		const harness = await create();

		// Act
		const state = await harness.submitState();

		// Assert
		expect([state, login.mock.calls.length]).toEqual([{ loading: false, disabled: false }, 0]);
	});

	it('starts the sign-in and shows it in progress to prevent a second click', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.submit();

		// Assert
		expect([await harness.submitState(), login.mock.calls.length]).toEqual([{ loading: true, disabled: true }, 1]);
	});

	it('reveals the hero photo once it has loaded', async () => {
		// Arrange
		const harness = await create();
		const before = await harness.heroPhotoShown();

		// Act
		await harness.heroPhotoLoaded();

		// Assert
		expect([before, await harness.heroPhotoShown()]).toEqual([false, true]);
	});
});
