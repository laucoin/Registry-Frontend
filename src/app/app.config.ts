import { EnvironmentProviders, importProvidersFrom, Injectable, Provider } from '@angular/core'
import { EnvironmentConfigModel } from './shared/util-model/config/environment-config.model'
import { StringUtils } from './shared/utils/string.util'
import { ExecutionContextEnum } from './shared/util-model/config/execution-context.enum'
import { ConfigModel } from './shared/util-model/config/config.model'
import { UserManager } from 'oidc-client-ts'
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin'
import { environment } from '../environments/environment'
import { NgxsModule } from '@ngxs/store'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { HttpClient } from '@angular/common/http'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { EnvironmentModel } from './config/environment.model'
import { sgdfConfig } from './config/sgdf.config'

@Injectable( {
    providedIn: 'root',
} )
export class AppConfig {
    private static readonly _jsonURL: string = 'config/config.json'
    public static config: ConfigModel

    public static load (): Promise<AppConfig> {
        return new Promise( (
            resolve: (value: (PromiseLike<AppConfig> | AppConfig)) => void,
            reject: (reason?: Error) => void,
        ): void => {
            fetch( StringUtils.addCacheBustingToUrl( this._jsonURL ) )
                .then( (res: Response): Promise<EnvironmentConfigModel> => res.json() )
                .then( (res: EnvironmentConfigModel): void => {
                    const tempConfig: EnvironmentModel & EnvironmentConfigModel = {
                        ...environment,
                        ...res,
                    }

                    switch (res.executionContext) {
                        case ExecutionContextEnum.SGDF:
                            AppConfig.config = {
                                ...sgdfConfig,
                                ...tempConfig,
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

    public static provideOidc (): Provider | EnvironmentProviders {
        return {
            provide: UserManager,
            useFactory: () => new UserManager( {
                authority: AppConfig.config.security.oidcUrl,
                client_id: AppConfig.config.security.clientId,
                client_secret: AppConfig.config.security.clientSecret,
                redirect_uri: `${AppConfig.config.frontendUrl}/auth-callback`,
                silent_redirect_uri: `${AppConfig.config.frontendUrl}/silent-auth-callback`,
                post_logout_redirect_uri: `${AppConfig.config.frontendUrl}/home`,
                response_type: 'code',
                checkSessionIntervalInSeconds: 500,
                scope: 'openid profile email roles',
                filterProtocolClaims: true,
                loadUserInfo: false,
                automaticSilentRenew: true,
                accessTokenExpiringNotificationTimeInSeconds: 14160,
                includeIdTokenInSilentRenew: true,
            } ),
        }
    }

    public static provideNgxs (): Provider | EnvironmentProviders {
        return importProvidersFrom(
            NgxsModule.forRoot( [], {
                developmentMode: !environment.production,
            } ),
        )

    }

    public static provideNgxsReduxDevtools (): Provider | EnvironmentProviders {
        return importProvidersFrom(
            NgxsReduxDevtoolsPluginModule.forRoot( {
                disabled: environment.production,
            } ),
        )
    }

    public static provideTranslator (): Provider | EnvironmentProviders {
        return importProvidersFrom(
            TranslateModule.forRoot( {
                defaultLanguage: AppConfig.config.defaultLanguage,
                loader: {
                    provide: TranslateLoader,
                    useFactory: (http: HttpClient) =>
                        new TranslateHttpLoader( http, 'i18n/', '.json' ),
                    deps: [ HttpClient ],
                },
            } ),
        )
    }
}
