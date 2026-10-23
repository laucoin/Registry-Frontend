import { EnvironmentProviders, inject, Injectable, Injector, provideAppInitializer, Provider } from '@angular/core'
import { BrowserService } from '@core/browser/browser.service'
import { ConfigModel } from '@core/config/model/config.model';
import { EnvironmentModel } from '@core/config/model/environment.model'
import { RegistryTranslationLoader } from '@core/config/registry-translation.loader'
import {
    provideTransloco,
    TRANSLOCO_CONFIG,
    TranslocoConfig,
    translocoConfig,
    TranslocoService
} from '@jsverse/transloco'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { LocalStorageUtils } from '@shared/helpers/local-storage.helper'
import { LOCALE } from '@shared/helpers/request.helper'
import { StringHelper } from '@shared/helpers/string.helper'
import { firstValueFrom } from 'rxjs'
import { version } from '../../../../package.json';

/**
 * Purpose: Loads the runtime configuration and builds the providers that depend on it.
 * Scope: Owns the config and environment JSON loading, the Transloco configuration.
 * Limits: Nothing is compiled into the bundle; it does not read user preferences beyond the browser locale.
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
		return provideAppInitializer((): Promise<unknown> => RegistryConfig.load())
	}

	private static loading: Promise<unknown> | undefined

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

	private static resolveLocale(preferredLanguages: readonly string[]): string {
		let lang: string | undefined = LocalStorageUtils.get(LOCALE)?.toString()

		if (GenericHelper.nonNull(lang) && lang && !RegistryConfig.config.languages.includes(lang)) {
			LocalStorageUtils.delete(LOCALE)
			lang = undefined
		}

		if (GenericHelper.isNull(lang) || !RegistryConfig.config.languages.includes(lang!)) {
			preferredLanguages.forEach((nextLang: string): void => {
				if (RegistryConfig.config.languages.includes(nextLang) && !lang) {
					lang = nextLang
				}
			})
		}

		lang = lang ?? RegistryConfig.config.defaultLanguage
		LocalStorageUtils.set(LOCALE, lang)

		return lang
	}

	private static buildTranslocoConfig(preferredLanguages: readonly string[]): TranslocoConfig {
		return translocoConfig({
			availableLangs: RegistryConfig.config.languages,
			defaultLang: RegistryConfig.resolveLocale(preferredLanguages),
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
				useFactory: (): TranslocoConfig => RegistryConfig.buildTranslocoConfig(inject(BrowserService).preferredLanguages)
			},
			provideAppInitializer(async (): Promise<unknown> => {
				const injector: Injector = inject(Injector)
				await RegistryConfig.load()
				const translateService: TranslocoService = injector.get(TranslocoService)

				const activeLang: string = translateService.getActiveLang()
				injector.get(BrowserService).setRootLanguage(activeLang)

				return firstValueFrom(translateService.load(activeLang))
			}),
		]
	}
}
