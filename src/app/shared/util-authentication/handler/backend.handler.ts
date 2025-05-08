import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpHeaders,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, mergeMap, Observable, tap, throwError } from 'rxjs'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import {
    AUTHORIZATION,
    CURRENT_USER_ID,
    REDIRECT_URI,
    SELECT_PROFILE_PROJECT_ID,
    TOKEN,
} from '../../util-tool/util/request.util'
import { TokenModel } from '../model/token.model'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { AppConfig } from '../../../app.config'
import { ErrorModel } from '../../util-model/model/error.model'
import { TranslateService } from '@ngx-translate/core'
import { SecurityService } from '../service/security.service'
import { GenericUtil } from '../../util-tool/util/generic.util'

export const backendHandler: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
    if (!req.url.startsWith( AppConfig.config.backend.url )) {
        return next( req )
    }

    const registryFacade: RegistryFacade = inject( RegistryFacade )
    const securityService: SecurityService = inject( SecurityService )
    const translateService: TranslateService = inject( TranslateService )

    const currentUser: CurrentUserModel | undefined = registryFacade.currentUser()
    const url: string = formatUrlIfNeeded( currentUser, req.url )

    return next( req.clone( {
        url: url,
        headers: buildHeaders( req.url, registryFacade.token(), req.headers ),
    } ) )
        .pipe( catchError( (error: HttpErrorResponse) => {
            if (AppConfig.config.backend.noAuthPaths.some( (permitAll: string): boolean => req.url.includes( permitAll ) ) && error.status === 401) {
                SessionStorageUtils.set( REDIRECT_URI, location.pathname )
                registryFacade.login()
            }

            switch (error.status) {
                case 0:
                case 502:
                case 503:
                    return throwError( (): ErrorModel => ({
                        status: 503,
                        name: 'Service Unavailable',
                        title: translateService.instant( 'global.notifications.503.title' ),
                        message: translateService.instant( 'global.notifications.503.message' ),
                    }) )
                case 401:
                    if (GenericUtil.isNull( registryFacade.token() )) {
                        registryFacade.login()
                    }
                    return securityService.refreshToken( registryFacade.token()!.refreshToken ).pipe(
                        tap( (token: TokenModel): void => {
                            SessionStorageUtils.set( TOKEN, token )
                            registryFacade.restoreTokensFromSessionStorage()
                        } ),
                        mergeMap( (newToken: TokenModel): Observable<HttpEvent<unknown>> => {
                            const retryHeaders: HttpHeaders = buildHeaders( req.url, newToken, req.headers )
                            return next( req.clone( { url: url, headers: retryHeaders } ) )
                        } ),
                    )
                default:
                    return throwError( (): ErrorModel => new ErrorModel( error ) )
            }
        } ) )
}

function formatUrlIfNeeded (currentUser: CurrentUserModel | undefined, url: string): string {
    let formattedUrl: string = url

    if (formattedUrl.includes( CURRENT_USER_ID )) {
        formattedUrl = formattedUrl.replace( CURRENT_USER_ID, currentUser?.id ?? '' )
    }

    if (formattedUrl.includes( SELECT_PROFILE_PROJECT_ID )) {
        formattedUrl = formattedUrl.replace(
            SELECT_PROFILE_PROJECT_ID,
            currentUser?.preferences?.selectedProfile?.project.id ?? '',
        )
    }

    return formattedUrl
}

function buildHeaders (url: string, token: TokenModel | undefined, headers: HttpHeaders | undefined): HttpHeaders {
    let filledHeaders: HttpHeaders = headers ?? new HttpHeaders()

    if (AppConfig.config.backend.noAuthPaths.some( (permitAll: string): boolean => url.includes( permitAll ) )) {
        return filledHeaders
    }

    filledHeaders = filledHeaders.set( AUTHORIZATION, `${token?.tokenType} ${token?.accessToken}` )
    return filledHeaders
}
