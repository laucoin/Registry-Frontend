import { EnvironmentProviders, inject, Injectable, Injector, provideAppInitializer, Provider } from '@angular/core';

import {
	provideTransloco,
	TRANSLOCO_CONFIG,
	TranslocoConfig,
	translocoConfig,
	TranslocoService,
} from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { BrowserService, PREFERENCE_COOKIE_MAX_AGE_SECONDS } from '@core/browser/browser.service';
import { ConfigModel, DEFAULT_LIST_CONFIG } from '@core/config/model/config.model';
import { EnvironmentModel } from '@core/config/model/environment.model';
import { RegistryTranslationLoader } from '@core/config/registry-translation.loader';
import { UiFacade } from '@core/registry/state/ui.facade';
import { LOCALE } from '@shared/helpers/request.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { ErrorModel } from '@shared/models/model/error.model';
import { version } from '@package';

/**
 * Purpose: Charge la configuration d'exécution et construit les providers qui en dépendent.
 * Scope: Possède le chargement des JSON de config et d'environnement, la configuration de Transloco.
 * Limits: Rien n'est compilé dans le bundle ; ne lit pas les préférences de l'utilisateur au-delà de la locale mémorisée ou de celle du navigateur.
 */
@Injectable({
	providedIn: 'root',
})
export class RegistryConfig {
	private static readonly _configJsonURL: string = 'settings/config.json';
	public static config: ConfigModel;

	private static readonly _envJsonURL: string = 'settings/env.json';
	public static environment: EnvironmentModel;

	public static provideRuntimeConfig(): EnvironmentProviders {
		return provideAppInitializer(() => RegistryConfig.loadOrFail());
	}

	private static loading: Promise<unknown> | undefined;

	private static readonly FALLBACK_CONFIG: ConfigModel = {
		defaultLanguage: 'fr',
		languages: ['fr'],
		application: { name: 'Registry', organization: '', creator: { name: '', email: '', website: '' }, support: {} },
		list: DEFAULT_LIST_CONFIG,
		notification: {
			duration: {
				info: undefined,
				success: undefined,
				warn: undefined,
				error: undefined,
				secondary: undefined,
				contrast: undefined,
			},
		},
	};
	private static readonly FALLBACK_ENVIRONMENT: EnvironmentModel = {
		production: true,
		backend: { url: 'about:blank', noAuthPaths: [] },
		hosting: { providerName: null, providerAddress: null },
	};

	private static startupError: unknown;

	private static async loadOrFail(): Promise<void> {
		try {
			await RegistryConfig.load();
		} catch (error: unknown) {
			RegistryConfig.config ??= RegistryConfig.FALLBACK_CONFIG;
			RegistryConfig.environment ??= RegistryConfig.FALLBACK_ENVIRONMENT;
			RegistryConfig.startupError ??= error;
		}
	}

	private static reportStartupFailure(injector: Injector): void {
		if (RegistryConfig.startupError === undefined) return;
		const error: unknown = RegistryConfig.startupError;
		RegistryConfig.startupError = undefined;
		const translateService = injector.get(TranslocoService);
		injector
			.get(UiFacade)
			.setGlobalError(
				ErrorModel.of(
					translateService.translate('global.notifications.startup.title'),
					error instanceof Error ? error.message : String(error),
				),
			);
	}

	private static load(): Promise<unknown> {
		return (this.loading ??= Promise.all([
			RegistryConfig.fetchJson<ConfigModel>(this._configJsonURL).then(
				(res): ConfigModel =>
					(RegistryConfig.config = {
						...res,
						application: { ...res.application, version },
					}),
			),
			RegistryConfig.fetchJson<EnvironmentModel>(this._envJsonURL).then(
				(res) => (RegistryConfig.environment = res),
			),
		]));
	}

	private static async fetchJson<T>(url: string): Promise<T> {
		const response = await fetch(StringHelper.addCacheBustingToUrl(url));
		if (!response.ok) {
			throw new Error(`Unable to load ${url} (${response.status})`);
		}
		return response.json();
	}

	private static resolveLocale(browser: BrowserService): string {
		const lang =
			RegistryConfig.supportedLanguage(browser.readCookie(LOCALE)) ??
			RegistryConfig.preferredLanguage(browser) ??
			RegistryConfig.config.defaultLanguage;
		browser.writeCookie(LOCALE, lang, PREFERENCE_COOKIE_MAX_AGE_SECONDS);

		return lang;
	}

	private static supportedLanguage(lang: string | undefined): string | undefined {
		return lang && RegistryConfig.config.languages.includes(lang) ? lang : undefined;
	}

	private static preferredLanguage(browser: BrowserService): string | undefined {
		return browser.preferredLanguages
			.flatMap((language) => [language, language.split('-')[0]])
			.find((candidate) => RegistryConfig.supportedLanguage(candidate) !== undefined);
	}

	private static buildTranslocoConfig(browser: BrowserService): TranslocoConfig {
		return translocoConfig({
			availableLangs: RegistryConfig.config.languages,
			defaultLang: RegistryConfig.resolveLocale(browser),
			fallbackLang: RegistryConfig.config.defaultLanguage,
			reRenderOnLangChange: true,
			prodMode: RegistryConfig.environment.production,
		});
	}

	public static provideTranslatorService(): (Provider | EnvironmentProviders)[] {
		return [
			provideTransloco({ config: {}, loader: RegistryTranslationLoader }),
			{
				provide: TRANSLOCO_CONFIG,
				useFactory: () => RegistryConfig.buildTranslocoConfig(inject(BrowserService)),
			},
			provideAppInitializer(async () => {
				const injector = inject(Injector);
				await RegistryConfig.loadOrFail();
				const translateService = injector.get(TranslocoService);

				const activeLang = translateService.getActiveLang();
				injector.get(BrowserService).setRootLanguage(activeLang);

				try {
					await firstValueFrom(translateService.load(activeLang));
				} catch (error: unknown) {
					RegistryConfig.startupError ??= error;
				}
				RegistryConfig.reportStartupFailure(injector);
			}),
		];
	}
}
