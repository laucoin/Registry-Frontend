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

const CONFIG_JSON_URL = 'settings/config.json';
const ENV_JSON_URL = 'settings/env.json';

const FALLBACK_CONFIG: ConfigModel = {
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

const FALLBACK_ENVIRONMENT: EnvironmentModel = {
	production: true,
	backend: { url: 'about:blank', noAuthPaths: [] },
	hosting: { providerName: null, providerAddress: null },
};

/**
 * Objectif: Valeurs de configuration et d'environnement lues au démarrage, et providers qui en dépendent.
 * Périmètre: Expose la configuration et l'environnement chargés, et fournit l'initialiseur de configuration et la configuration de Transloco.
 * Limites: Rien n'est compilé dans le bundle ; le chargement lui-même appartient à `RuntimeConfigLoader`.
 */
export const RegistryConfig = {
	config: undefined as unknown as ConfigModel,
	environment: undefined as unknown as EnvironmentModel,

	provideRuntimeConfig(): EnvironmentProviders {
		return provideAppInitializer(() => inject(RuntimeConfigLoader).loadOrFail());
	},

	provideTranslatorService(): (Provider | EnvironmentProviders)[] {
		return [
			provideTransloco({ config: {}, loader: RegistryTranslationLoader }),
			{ provide: TRANSLOCO_CONFIG, useFactory: () => buildTranslocoConfig(inject(BrowserService)) },
			provideAppInitializer(() => initializeTranslations(inject(Injector))),
		];
	},
};

/**
 * Objectif: Charge une seule fois les fichiers de configuration et d'environnement au démarrage.
 * Périmètre: Retombe sur une configuration neutre quand un fichier manque, retient la première erreur de démarrage et la signale à l'utilisateur.
 * Limites: Ne recharge jamais la configuration ; ne lit pas les préférences de l'utilisateur.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeConfigLoader {
	private loading: Promise<void> | undefined;
	private startupError: unknown;

	public loadOrFail(): Promise<void> {
		return (this.loading ??= loadSettings().catch((error: unknown) => this.fallBack(error)));
	}

	public recordStartupError(error: unknown): void {
		this.startupError ??= error;
	}

	public reportStartupFailure(injector: Injector): void {
		if (this.startupError === undefined) return;
		const error: unknown = this.startupError;
		this.startupError = undefined;
		const title = injector.get(TranslocoService).translate('global.notifications.startup.title');
		injector
			.get(UiFacade)
			.setGlobalError(ErrorModel.of(title, error instanceof Error ? error.message : String(error)));
	}

	private fallBack(error: unknown): void {
		RegistryConfig.config ??= FALLBACK_CONFIG;
		RegistryConfig.environment ??= FALLBACK_ENVIRONMENT;
		this.recordStartupError(error);
	}
}

async function loadSettings(): Promise<void> {
	const [config, environment] = await Promise.all([
		fetchJson<ConfigModel>(CONFIG_JSON_URL),
		fetchJson<EnvironmentModel>(ENV_JSON_URL),
	]);
	RegistryConfig.config = { ...config, application: { ...config.application, version } };
	RegistryConfig.environment = environment;
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(StringHelper.addCacheBustingToUrl(url));
	if (!response.ok) {
		throw new Error(`Unable to load ${url} (${response.status})`);
	}
	return response.json();
}

async function initializeTranslations(injector: Injector): Promise<void> {
	const loader = injector.get(RuntimeConfigLoader);
	await loader.loadOrFail();
	const translateService = injector.get(TranslocoService);
	const activeLang = translateService.getActiveLang();
	injector.get(BrowserService).setRootLanguage(activeLang);
	try {
		await firstValueFrom(translateService.load(activeLang));
	} catch (error: unknown) {
		loader.recordStartupError(error);
	}
	loader.reportStartupFailure(injector);
}

function buildTranslocoConfig(browser: BrowserService): TranslocoConfig {
	return translocoConfig({
		availableLangs: RegistryConfig.config.languages,
		defaultLang: resolveLocale(browser),
		fallbackLang: RegistryConfig.config.defaultLanguage,
		reRenderOnLangChange: true,
		prodMode: RegistryConfig.environment.production,
	});
}

function resolveLocale(browser: BrowserService): string {
	const lang =
		supportedLanguage(browser.readCookie(LOCALE)) ??
		preferredLanguage(browser) ??
		RegistryConfig.config.defaultLanguage;
	browser.writeCookie(LOCALE, lang, PREFERENCE_COOKIE_MAX_AGE_SECONDS);
	return lang;
}

function supportedLanguage(lang: string | undefined): string | undefined {
	return lang && RegistryConfig.config.languages.includes(lang) ? lang : undefined;
}

function preferredLanguage(browser: BrowserService): string | undefined {
	return browser.preferredLanguages
		.flatMap((language) => [language, language.split('-')[0]])
		.find((candidate) => supportedLanguage(candidate) !== undefined);
}
