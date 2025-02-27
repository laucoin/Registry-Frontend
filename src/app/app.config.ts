import { HttpClient } from '@angular/common/http'
import { EnvironmentProviders, importProvidersFrom, Injectable, Provider } from '@angular/core'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
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

@Injectable( {
    providedIn: 'root',
} )
export class AppConfig {
    public static config: ConfigModel
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
                            AppConfig.config = {
                                ...sgdfConfig, ...tempConfig,
                            }
                            break
                        default:
                            AppConfig.config = tempConfig as ConfigModel
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
                developmentMode: !AppConfig.config.production,
            },
        ) )
    }

    public static providePrimeNg (): Provider | EnvironmentProviders {
        return providePrimeNG( {
            ripple: true,
            theme: {
                preset: AppConfig.config.theme,
                options: {
                    darkModeSelector: `.dark-mod`,
                },
            },
        } )
    }

    public static provideNgxsReduxDevtools (): Provider | EnvironmentProviders {
        return importProvidersFrom( NgxsReduxDevtoolsPluginModule.forRoot( {
            disabled: AppConfig.config.production,
        } ) )
    }

    private static get locale (): string {
        let lang: string | undefined = LocalStorageUtils.get( LOCALE )?.toString()

        if (GenericUtil.isNull( lang ) || !AppConfig.config.languages.includes( lang! )) {
            navigator.languages.forEach( (nextLang: string): void => {
                if (AppConfig.config.languages.includes( nextLang ) && !lang) {
                    lang = nextLang
                }
            } )
        }

        lang = lang ?? AppConfig.config.defaultLanguage
        LocalStorageUtils.set( LOCALE, lang )
        return lang
    }

    public static provideTranslator (): Provider | EnvironmentProviders {
        return importProvidersFrom( TranslateModule.forRoot( {
            defaultLanguage: this.locale, loader: {
                provide: TranslateLoader,
                useFactory: (http: HttpClient) => new TranslateHttpLoader(
                    http,
                    `i18n/${AppConfig.config.executionContext}/`,
                    '.json',
                ),
                deps: [ HttpClient ],
            },
        } ) )
    }
}
