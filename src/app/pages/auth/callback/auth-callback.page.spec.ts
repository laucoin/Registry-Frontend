import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AuthCallbackPage } from '@pages/auth/callback/auth-callback.page';
import { AuthCallbackHarness } from '@pages/auth/callback/testing/auth-callback.harness';
import { autoMock } from '@shared/helpers/testing/auto-mock';

describe('AuthCallbackPage', () => {
	let facade: Record<string, Mock>;
	let uiFacade: Record<string, Mock>;

	function create(params: Record<string, string>): AuthCallbackPage {
		facade = autoMock();
		uiFacade = autoMock();
		TestBed.configureTestingModule({
			providers: [
				{ provide: SessionFacade, useValue: facade },
				{ provide: UiFacade, useValue: uiFacade },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
				{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(params) } } },
			],
		});
		return TestBed.createComponent(AuthCallbackPage).componentInstance;
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('exchanges the authorization code for a session', () => {
		// Arrange
		const page = create({ code: 'abc' });

		// Act
		page.ngOnInit();

		// Assert
		expect(facade['fetchToken']).toHaveBeenCalledWith('abc');
		expect(uiFacade['setGlobalError']).not.toHaveBeenCalled();
	});

	it.each<{ name: string; params: Record<string, string>; suffix: string }>([
		{ name: 'appends an oauth error code', params: { error: 'access_denied' }, suffix: ' (access_denied)' },
		{
			name: 'ignores the free text description',
			params: { error: 'access_denied', error_description: 'Call 06 00 00 00 00' },
			suffix: ' (access_denied)',
		},
		{ name: 'drops an error that is not an oauth code', params: { error: 'Your account is locked' }, suffix: '' },
		{ name: 'shows the plain message without any error', params: {}, suffix: '' },
	])('shows the translated error and $name when the redirect carries no code', ({ params, suffix }) => {
		// Arrange
		const page = create(params);

		// Act
		page.ngOnInit();

		// Assert
		expect(uiFacade['setGlobalError']).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'global.notifications.auth-callback.title',
				message: `global.notifications.auth-callback.message${suffix}`,
			}),
		);
	});

	it.each<{ name: string; params: Record<string, string>; label: string | undefined }>([
		{
			name: 'shows a loading indicator while the code is exchanged',
			params: { code: 'abc' },
			label: 'fr.global.auth-callback.signing-in',
		},
		{ name: 'shows no indicator when the redirect carries no code', params: {}, label: undefined },
	])('$name', async ({ params, label }) => {
		// Arrange
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: autoMock() },
				{ provide: UiFacade, useValue: autoMock() },
				{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(params) } } },
			],
		});

		// Act
		const harness = await TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(AuthCallbackPage),
			AuthCallbackHarness,
		);

		// Assert
		expect(await harness.spinnerLabel()).toBe(label);
	});
});
