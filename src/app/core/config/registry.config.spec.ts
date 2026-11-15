import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TRANSLOCO_CONFIG, TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BrowserService } from '@core/browser/browser.service';
import { ConfigModel } from '@core/config/model/config.model';
import { EnvironmentModel } from '@core/config/model/environment.model';
import { RegistryConfig, RuntimeConfigLoader } from '@core/config/registry.config';
import { UiFacade } from '@core/registry/state/ui.facade';

const echoKey: TranslocoService['translate'] = ((key: string): string => key) as TranslocoService['translate'];

function configureStartup(setGlobalError: ReturnType<typeof vi.fn>): void {
	const translocoService: Partial<TranslocoService> = {
		getActiveLang: () => 'fr',
		load: () => of({}),
		translate: echoKey,
	};
	TestBed.configureTestingModule({
		providers: [
			provideHttpClient(),
			provideHttpClientTesting(),
			{ provide: UiFacade, useValue: { setGlobalError } },
			{
				provide: BrowserService,
				useValue: {
					preferredLanguages: ['fr'],
					setRootLanguage: vi.fn(),
					readCookie: (): undefined => undefined,
					writeCookie: vi.fn(),
				},
			},
			...RegistryConfig.provideTranslatorService(),
			{ provide: TranslocoService, useValue: translocoService },
		],
	});
}

describe('RegistryConfig', () => {
	const CONFIG = {
		defaultLanguage: 'fr',
		languages: ['fr', 'en'],
		application: { name: 'Registry' },
	} as unknown as ConfigModel;
	const ENVIRONMENT = { production: true } as unknown as EnvironmentModel;

	function fakeBrowser(remembered: string | undefined, preferredLanguages: string[]): Partial<BrowserService> {
		return { readCookie: () => remembered, writeCookie: vi.fn(), setRootLanguage: vi.fn(), preferredLanguages };
	}

	function resolvedLanguage(browser: Partial<BrowserService>): string | undefined {
		stubFetch();
		TestBed.configureTestingModule({
			providers: [{ provide: BrowserService, useValue: browser }, ...RegistryConfig.provideTranslatorService()],
		});
		return TestBed.inject(TRANSLOCO_CONFIG).defaultLang;
	}

	function stubFetch(ok = true): void {
		vi.stubGlobal(
			'fetch',
			vi.fn((url: string) =>
				Promise.resolve({
					ok,
					status: ok ? 200 : 404,
					json: (): Promise<unknown> =>
						Promise.resolve(url.startsWith('settings/config.json') ? CONFIG : ENVIRONMENT),
				}),
			),
		);
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
		RegistryConfig.config = CONFIG;
		RegistryConfig.environment = ENVIRONMENT;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('loads the configuration and the environment from the settings files', async () => {
		// Arrange
		stubFetch();

		// Act
		await TestBed.inject(RuntimeConfigLoader).loadOrFail();

		// Assert
		expect(RegistryConfig.config.defaultLanguage).toBe('fr');
		expect(RegistryConfig.config.application.version).toBeDefined();
		expect(RegistryConfig.environment).toEqual(ENVIRONMENT);
	});

	it('fetches the config and the environment once each when loaded twice', async () => {
		// Arrange
		stubFetch();

		// Act
		const loader = TestBed.inject(RuntimeConfigLoader);
		await Promise.all([loader.loadOrFail(), loader.loadOrFail()]);

		// Assert
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('reports which settings file could not be fetched', async () => {
		// Arrange
		stubFetch(false);
		const setGlobalError: ReturnType<typeof vi.fn> = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				{ provide: UiFacade, useValue: { setGlobalError } },
				{ provide: TranslocoService, useValue: { translate: echoKey } },
			],
		});
		const loader = TestBed.inject(RuntimeConfigLoader);

		// Act
		await loader.loadOrFail();
		loader.reportStartupFailure(TestBed.inject(Injector));

		// Assert
		expect(setGlobalError).toHaveBeenCalledWith(
			expect.objectContaining({ message: 'Unable to load settings/config.json (404)' }),
		);
	});

	it('keeps the language remembered in the cookie when it is available', () => {
		// Arrange
		const browser = fakeBrowser('en', ['fr']);

		// Act
		const locale = resolvedLanguage(browser);

		// Assert
		expect(locale).toBe('en');
	});

	it('forgets a remembered language that is no longer available', () => {
		// Arrange
		const browser = fakeBrowser('de', ['en']);

		// Act
		const locale = resolvedLanguage(browser);

		// Assert
		expect(locale).toBe('en');
	});

	it('falls back on the default language when no preferred language is available', () => {
		// Arrange
		const browser = fakeBrowser(undefined, ['de', 'es']);

		// Act
		const locale = resolvedLanguage(browser);

		// Assert
		expect(locale).toBe('fr');
	});

	it('resolves a regional preferred language to its base language', () => {
		// Arrange
		const browser = fakeBrowser(undefined, ['en-GB', 'fr']);

		// Act
		const locale = resolvedLanguage(browser);

		// Assert
		expect(locale).toBe('en');
	});

	it('activates the resolved language and applies it on the root element once initialized', async () => {
		// Arrange
		stubFetch();
		const setRootLanguage: ReturnType<typeof vi.fn> = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: BrowserService,
					useValue: {
						preferredLanguages: ['en'],
						setRootLanguage,
						readCookie: (): undefined => undefined,
						writeCookie: vi.fn(),
					},
				},
				...RegistryConfig.provideTranslatorService(),
			],
		});
		const httpTesting = TestBed.inject(HttpTestingController);

		// Act
		const initialized: Promise<void> = TestBed.inject(ApplicationInitStatus).donePromise;
		await vi.waitFor(() => {
			httpTesting.expectOne('i18n/en.json').flush({});
		});
		await initialized;

		// Assert
		expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('en');
		expect(setRootLanguage).toHaveBeenCalledWith('en');
	});

	it('loads the settings before the application starts', async () => {
		// Arrange
		stubFetch();
		TestBed.configureTestingModule({ providers: [RegistryConfig.provideRuntimeConfig()] });

		// Act
		await TestBed.inject(ApplicationInitStatus).donePromise;

		// Assert
		expect(RegistryConfig.environment).toEqual(ENVIRONMENT);
	});

	it('falls back on a neutral configuration and reports the error when the settings cannot be loaded', async () => {
		// Arrange
		stubFetch(false);
		const setGlobalError: ReturnType<typeof vi.fn> = vi.fn();
		RegistryConfig.config = undefined as unknown as ConfigModel;
		RegistryConfig.environment = undefined as unknown as EnvironmentModel;
		configureStartup(setGlobalError);

		// Act
		await TestBed.inject(ApplicationInitStatus).donePromise;

		// Assert
		expect(RegistryConfig.config.defaultLanguage).toBe('fr');
		expect(RegistryConfig.environment.backend.url).toBe('about:blank');
		expect(setGlobalError).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'global.notifications.startup.title' }),
		);
	});

	it.each([
		['an error', new Error('boom')],
		['a bare value', 'boom'],
	])(
		'reports %s and keeps the application starting when the translations cannot be loaded',
		async (_label, failure) => {
			// Arrange
			stubFetch();
			const setGlobalError: ReturnType<typeof vi.fn> = vi.fn();
			const translocoService: Partial<TranslocoService> = {
				getActiveLang: () => 'en',
				load: () => throwError(() => failure),
				translate: echoKey,
			};
			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(),
					provideHttpClientTesting(),
					{ provide: UiFacade, useValue: { setGlobalError } },
					{
						provide: BrowserService,
						useValue: {
							preferredLanguages: ['en'],
							setRootLanguage: vi.fn(),
							readCookie: (): undefined => undefined,
							writeCookie: vi.fn(),
						},
					},
					...RegistryConfig.provideTranslatorService(),
					{ provide: TranslocoService, useValue: translocoService },
				],
			});

			// Act
			await TestBed.inject(ApplicationInitStatus).donePromise;

			// Assert
			expect(setGlobalError).toHaveBeenCalledTimes(1);
			expect(setGlobalError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
		},
	);
});
