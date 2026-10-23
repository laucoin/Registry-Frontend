import { EnvironmentProviders, inject, Injectable, Injector, provideAppInitializer, Provider } from '@angular/core'
import { BrowserService, PREFERENCE_COOKIE_MAX_AGE_SECONDS } from '@core/browser/browser.service'
import { ConfigModel } from '@core/config/model/config.model';
import { EnvironmentModel } from '@core/config/model/environment.model'
import { RegistryTranslationLoader } from '@core/config/registry-translation.loader'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ErrorModel } from '@shared/models/model/error.model'
import {
    provideTransloco,
    TRANSLOCO_CONFIG,
    TranslocoConfig,
    translocoConfig,
    TranslocoService
} from '@jsverse/transloco'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { LOCALE } from '@shared/helpers/request.helper'
import { StringHelper } from '@shared/helpers/string.helper'
import { firstValueFrom } from 'rxjs'
import { version } from '../../../../package.json';

/**
 * Purpose: Loads the runtime configuration and builds the providers that depend on it.
 * Scope: Owns the config and environment JSON loading, the Transloco configuration.
 * Limits: Nothing is compiled into the bundle; it does not read user preferences beyond the remembered or browser locale.
 */
@Injectable({
	providedIn: 'root',
})
export class RegistryConfig {
	private static readonly _configJsonURL: string = 'settings/config.json'
	public static config: ConfigModel

	private static readonly _envJsonURL: string = 'settings/env.json'
	public static environment: EnvironmentModel

	public static provideRuntimeConfig(): EnvironmentProviders {
		return provideAppInitializer((): Promise<void> => RegistryConfig.loadOrFail())
	}

	private static loading: Promise<unknown> | undefined

	private static readonly FALLBACK_CONFIG: ConfigModel = {
		defaultLanguage: 'fr',
		languages: ['fr'],
		application: { name: 'Registry', organization: '', creator: { name: '', email: '', website: '' }, support: {} },
		enabledActions: [],
		notification: { duration: { info: undefined, success: undefined, warn: undefined, error: undefined, secondary: undefined, contrast: undefined } },
	}
	private static readonly FALLBACK_ENVIRONMENT: EnvironmentModel = {
		production: true,
		backend: { url: 'about:blank', noAuthPaths: [] },
		hosting: { providerName: null, providerAddress: null },
	}

	private static startupError: unknown

	private static async loadOrFail(): Promise<void> {
		try {
			await RegistryConfig.load()
		} catch (error: unknown) {
			RegistryConfig.config ??= RegistryConfig.FALLBACK_CONFIG
			RegistryConfig.environment ??= RegistryConfig.FALLBACK_ENVIRONMENT
			RegistryConfig.startupError ??= error
		}
	}

	private static reportStartupFailure(injector: Injector): void {
		if (RegistryConfig.startupError === undefined) return
		const error: unknown = RegistryConfig.startupError
		RegistryConfig.startupError = undefined
		const translateService: TranslocoService = injector.get(TranslocoService)
		injector.get(UiFacade).setGlobalError(ErrorModel.of(
			translateService.translate('global.notifications.startup.title'),
			error instanceof Error ? error.message : String(error),
		))
	}

	private static load(): Promise<unknown> {
		return this.loading ??= Promise.all([
			RegistryConfig.fetchJson<ConfigModel>(this._configJsonURL).then((res: ConfigModel): ConfigModel => RegistryConfig.config = {
				...res,
				application: { ...res.application, version }
			}),
			RegistryConfig.fetchJson<EnvironmentModel>(this._envJsonURL).then((res: EnvironmentModel): EnvironmentModel => RegistryConfig.environment = res),
		])
	}

	private static async fetchJson<T>(url: string): Promise<T> {
		const response: Response = await fetch(StringHelper.addCacheBustingToUrl(url))
		if (!response.ok) {
			throw new Error(`Unable to load ${url} (${response.status})`)
		}
		return response.json()
	}

	private static resolveLocale(browser: BrowserService): string {
		let lang: string | undefined = browser.readCookie(LOCALE)

		if (GenericHelper.nonNull(lang) && lang && !RegistryConfig.config.languages.includes(lang)) {
			lang = undefined
		}

		if (GenericHelper.isNull(lang) || !RegistryConfig.config.languages.includes(lang!)) {
			browser.preferredLanguages.forEach((nextLang: string): void => {
				const base: string = nextLang.split('-')[0]
				const match: string | undefined = [nextLang, base].find((candidate: string): boolean => RegistryConfig.config.languages.includes(candidate))
				if (match && !lang) {
					lang = match
				}
			})
		}

		lang = lang ?? RegistryConfig.config.defaultLanguage
		browser.writeCookie(LOCALE, lang, PREFERENCE_COOKIE_MAX_AGE_SECONDS)

		return lang
	}

	private static buildTranslocoConfig(browser: BrowserService): TranslocoConfig {
		return translocoConfig({
			availableLangs: RegistryConfig.config.languages,
			defaultLang: RegistryConfig.resolveLocale(browser),
			fallbackLang: RegistryConfig.config.defaultLanguage,
			reRenderOnLangChange: true,
			prodMode: RegistryConfig.environment.production,
		})
	}

	public static provideTranslatorService(): (Provider | EnvironmentProviders)[] {
		return [
			provideTransloco({ config: {}, loader: RegistryTranslationLoader }),
			{
				provide: TRANSLOCO_CONFIG,
				useFactory: (): TranslocoConfig => RegistryConfig.buildTranslocoConfig(inject(BrowserService))
			},
			provideAppInitializer(async (): Promise<void> => {
				const injector: Injector = inject(Injector)
				await RegistryConfig.loadOrFail()
				const translateService: TranslocoService = injector.get(TranslocoService)

				const activeLang: string = translateService.getActiveLang()
				injector.get(BrowserService).setRootLanguage(activeLang)

				try {
					await firstValueFrom(translateService.load(activeLang))
				} catch (error: unknown) {
					RegistryConfig.startupError ??= error
				}
				RegistryConfig.reportStartupFailure(injector)
			}),
		]
	}
}
