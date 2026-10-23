import {EnvironmentProviders, Injectable, Provider} from '@angular/core'
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader'
import {EnvironmentModel} from '@core/config/model/environment.model'
import {StringHelper} from '@shared/helpers/string.helper'
import {providePrimeNG} from 'primeng/config'
import {LocalStorageUtils} from '@shared/helpers/local-storage.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {LOCALE} from '@shared/helpers/request.helper'
import {provideTranslateService} from '@ngx-translate/core'
import {ConfigModel} from '@core/config/model/config.model';
import {definePreset} from "@primeuix/themes";
import Lara from '@primeuix/themes/lara';

@Injectable({
    providedIn: 'root',
})
export class RegistryConfig {
    private static readonly _configJsonURL: string = 'settings/config.json'
    public static config: ConfigModel

    private static readonly _envJsonURL: string = 'settings/env.json'
    public static environment: EnvironmentModel

    public static load(): Promise<RegistryConfig> {
        return Promise.all([
            fetch(StringHelper.addCacheBustingToUrl(this._configJsonURL))
                .then((res: Response): Promise<ConfigModel> => res.json())
                .then((res: ConfigModel): ConfigModel => RegistryConfig.config = res)
                .catch((err: unknown) => console.error('An error occurred during loading config', err)),
            fetch(StringHelper.addCacheBustingToUrl(this._envJsonURL))
                .then((res: Response): Promise<EnvironmentModel> => res.json())
                .then((res: EnvironmentModel): EnvironmentModel => RegistryConfig.environment = res)
                .catch((err: unknown) => console.error('An error occurred during loading environment', err)),
        ])
    }

    public static providePrimeNg(): Provider | EnvironmentProviders {
        return providePrimeNG({
            ripple: true,
            theme: {
                preset: definePreset(Lara, RegistryConfig.config.primeNg),
                options: {
                    darkModeSelector: `.dark-mod`,
                },
            },
        })
    }

    private static get locale(): string {
        let lang: string | undefined = LocalStorageUtils.get(LOCALE)?.toString()

        if (GenericHelper.nonNull(lang) && lang && !RegistryConfig.config.languages.includes(lang)) {
            LocalStorageUtils.delete(LOCALE)
            lang = undefined
        }

        if (GenericHelper.isNull(lang) || !RegistryConfig.config.languages.includes(lang!)) {
            navigator.languages.forEach((nextLang: string): void => {
                if (RegistryConfig.config.languages.includes(nextLang) && !lang) {
                    lang = nextLang
                }
            })
        }

        lang = lang ?? RegistryConfig.config.defaultLanguage
        LocalStorageUtils.set(LOCALE, lang)

        return lang
    }

    public static provideTranslatorService(): Provider | EnvironmentProviders {
        return provideTranslateService({
            fallbackLang: RegistryConfig.config.defaultLanguage,
            lang: RegistryConfig.locale,
        })
    }

    public static provideTranslatorHttpLoader(): Provider | EnvironmentProviders {
        return provideTranslateHttpLoader({
            prefix: `i18n/`,
            suffix: '.json',
        })
    }
}
