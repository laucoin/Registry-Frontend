import { EnvironmentProviders, importProvidersFrom, Injectable, Provider } from '@angular/core'
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader'
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin'
import { NgxsModule } from '@ngxs/store'
import { RegistryState } from './shared/util-common/state/registry.state'
import { sgdfConfig } from './shared/util-config/config/sgdf.config'
import { ExecutionContextEnum } from './shared/util-config/enumeration/execution-context.enum'
import { ConfigModel } from './shared/util-config/model/config.model'
import { EnvironmentModel } from './shared/util-config/model/environment.model'
import { StringUtil } from './shared/util-tool/util/string.util'
import { UserState } from './domains/user/data/state/user.state'
import { providePrimeNG } from 'primeng/config'
import { LocalStorageUtils } from './shared/util-tool/util/local-storage.util'
import { GenericUtil } from './shared/util-tool/util/generic.util'
import { LOCALE } from './shared/util-tool/util/request.util'
import { provideTranslateService } from '@ngx-translate/core'

@Injectable( {
    providedIn: 'root',
} )
export class AppConfig {
    public static settings: ConfigModel
    private static readonly _jsonURL: string = 'config/config.json'

    public static load (): Promise<AppConfig> {
        return new Promise( (
            resolve: (value: (PromiseLike<AppConfig> | AppConfig)) => void,
            reject: (reason?: Error) => void,
        ): void => {
            fetch( StringUtil.addCacheBustingToUrl( this._jsonURL ) )
                .then( (res: Response): Promise<EnvironmentModel> => res.json() )
                .then( (res: EnvironmentModel): void => {
                    const tempConfig: EnvironmentModel = res

                    switch (res.executionContext) {
                        case ExecutionContextEnum.SGDF:
                            AppConfig.settings = {
                                ...sgdfConfig, ...tempConfig,
                            }
                            break
                        default:
                            AppConfig.settings = tempConfig as ConfigModel
                            break
                    }
                } )
                .then( () => resolve( AppConfig ) )
                .catch( (exception: Error): void => {
                    console.error( 'Failed to load application configuration', exception )
                    reject( exception )
                } )
        } )
    }

    public static provideNgxs (): Provider | EnvironmentProviders {
        return importProvidersFrom( NgxsModule.forRoot(
            [ RegistryState, UserState ],
            {
                developmentMode: !AppConfig.settings.production,
            },
        ) )
    }

    public static providePrimeNg (): Provider | EnvironmentProviders {
        return providePrimeNG( {
            ripple: true,
            theme: {
                preset: AppConfig.settings.theme,
                options: {
                    darkModeSelector: `.dark-mod`,
                },
            },
        } )
    }

    public static provideNgxsReduxDevtools (): Provider | EnvironmentProviders {
        return importProvidersFrom( NgxsReduxDevtoolsPluginModule.forRoot( {
            disabled: AppConfig.settings.production,
        } ) )
    }

    private static get locale (): string {
        let lang: string | undefined = LocalStorageUtils.get( LOCALE )?.toString()

        if (GenericUtil.isNull( lang ) || !AppConfig.settings.languages.includes( lang! )) {
            navigator.languages.forEach( (nextLang: string): void => {
                if (AppConfig.settings.languages.includes( nextLang ) && !lang) {
                    lang = nextLang
                }
            } )
        }

        lang = lang ?? AppConfig.settings.defaultLanguage
        LocalStorageUtils.set( LOCALE, lang )
        return lang
    }

    public static provideTranslatorService (): Provider | EnvironmentProviders {
        return provideTranslateService( {
            defaultLanguage: AppConfig.settings.defaultLanguage,
            lang: AppConfig.locale,
        } )
    }

    public static provideTranslatorHttpLoader (): Provider | EnvironmentProviders {
        return provideTranslateHttpLoader( {
            prefix: `i18n/${AppConfig.settings.executionContext}/`,
            suffix: '.json',
        } )
    }
}
