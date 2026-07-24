import {EnvironmentProviders, importProvidersFrom, Injectable, Provider} from '@angular/core'
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader'
import {NgxsReduxDevtoolsPluginModule} from '@ngxs/devtools-plugin'
import {NgxsModule} from '@ngxs/store'
import {RegistryState} from './shared/util-common/state/registry.state'
import {EnvironmentModel} from './shared/util-config/model/environment.model'
import {StringUtil} from './shared/util-tool/util/string.util'
import {UserState} from './domains/user/data/state/user.state'
import {providePrimeNG} from 'primeng/config'
import {LocalStorageUtils} from './shared/util-tool/util/local-storage.util'
import {GenericUtil} from './shared/util-tool/util/generic.util'
import {LOCALE} from './shared/util-tool/util/request.util'
import {provideTranslateService} from '@ngx-translate/core'
import {ConfigModel} from "./shared/util-config/model/config.model";
import {definePreset} from "@primeuix/themes";
import Lara from '@primeuix/themes/lara';

@Injectable({
    providedIn: 'root',
})
export class AppConfig {
    private static readonly _configJsonURL: string = 'settings/config.json'
    public static config: ConfigModel

    private static readonly _envJsonURL: string = 'settings/env.json'
    public static environment: EnvironmentModel

    public static load(): Promise<AppConfig> {
        return Promise.all([
            fetch(StringUtil.addCacheBustingToUrl(this._configJsonURL))
                .then((res: Response): Promise<ConfigModel> => res.json())
                .then((res: ConfigModel): ConfigModel => AppConfig.config = res)
                .catch((err: unknown) => console.error('An error occurred during loading config', err)),
            fetch(StringUtil.addCacheBustingToUrl(this._envJsonURL))
                .then((res: Response): Promise<EnvironmentModel> => res.json())
                .then((res: EnvironmentModel): EnvironmentModel => AppConfig.environment = res)
                .catch((err: unknown) => console.error('An error occurred during loading environment', err)),
        ])
    }

    public static provideNgxs(): Provider | EnvironmentProviders {
        return importProvidersFrom(NgxsModule.forRoot(
            [RegistryState, UserState],
            {
                developmentMode: !AppConfig.environment.production,
            },
        ))
    }

    public static providePrimeNg(): Provider | EnvironmentProviders {
        return providePrimeNG({
            ripple: true,
            theme: {
                preset: definePreset(Lara, AppConfig.config.primeNg),
                options: {
                    darkModeSelector: `.dark-mod`,
                },
            },
        })
    }

    public static provideNgxsReduxDevtools(): Provider | EnvironmentProviders {
        return importProvidersFrom(NgxsReduxDevtoolsPluginModule.forRoot({
            disabled: AppConfig.environment.production,
        }))
    }

    private static get locale(): string {
        let lang: string | undefined = LocalStorageUtils.get(LOCALE)?.toString()

        if (GenericUtil.nonNull(lang) && lang && !AppConfig.config.languages.includes(lang)) {
            LocalStorageUtils.delete(LOCALE)
            lang = undefined
        }

        if (GenericUtil.isNull(lang) || !AppConfig.config.languages.includes(lang!)) {
            navigator.languages.forEach((nextLang: string): void => {
                if (AppConfig.config.languages.includes(nextLang) && !lang) {
                    lang = nextLang
                }
            })
        }

        lang = lang ?? AppConfig.config.defaultLanguage
        LocalStorageUtils.set(LOCALE, lang)

        return lang
    }

    public static provideTranslatorService(): Provider | EnvironmentProviders {
        return provideTranslateService({
            fallbackLang: AppConfig.config.defaultLanguage,
            lang: AppConfig.locale,
        })
    }

    public static provideTranslatorHttpLoader(): Provider | EnvironmentProviders {
        return provideTranslateHttpLoader({
            prefix: `i18n/`,
            suffix: '.json',
        })
    }
}
