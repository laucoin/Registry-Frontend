import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpHeaders,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, map, mergeMap, Observable, throwError } from 'rxjs'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import {
    AUTHORIZATION,
    CURRENT_USER_ID,
    REDIRECT_URI,
    SELECT_PROFILE_EVENT_ID,
} from '../../util-tool/util/request.util'
import { TokenModel } from '../model/token.model'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { AppConfig } from '../../../app.config'

const BASE_URL: string = `/api/authentication`
const PERMIT_ALL: string[] = [
    `${BASE_URL}/login/uri`,
    `${BASE_URL}/logout/uri`,
    `${BASE_URL}/token`,
    `${BASE_URL}/token/refresh`,
]

export const backendHandler: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
    if (!req.url.startsWith( AppConfig.config.backendUrl )) {
        return next( req )
    }

    const registryFacade: RegistryFacade = inject( RegistryFacade )

    const currentUser: CurrentUserModel | undefined = registryFacade.actualCurrentUser
    const url: string = formatUrlIfNecessary( currentUser, req.url )

    return next( req.clone( {
        url: url,
        headers: buildHeaders( req.url, registryFacade.actualToken, req.headers ),
    } ) )
        .pipe( catchError( (error: HttpErrorResponse) => {
            if (PERMIT_ALL.some( (permitAll: string): boolean => req.url.includes( permitAll ) ) && error.status === 401) {
                SessionStorageUtils.set( REDIRECT_URI, location.pathname )
                registryFacade.login()
            }

            switch (error.status) {
                case 0:
                    return throwError( (): HttpErrorResponse => new HttpErrorResponse( { status: 503 } ) )
                case 401:
                    return registryFacade.refreshToken().pipe(
                        map( (): TokenModel => registryFacade.actualToken! ),
                        mergeMap( (newToken: TokenModel): Observable<HttpEvent<unknown>> => {
                            const retryHeaders: HttpHeaders = buildHeaders( req.url, newToken, req.headers )
                            return next( req.clone( { url: url, headers: retryHeaders } ) )
                        } ),
                    )
                default:
                    return throwError( (): HttpErrorResponse => error )
            }
        } ) )
}

function formatUrlIfNecessary (currentUser: CurrentUserModel | undefined, url: string): string {
    let formattedUrl: string = url

    if (formattedUrl.includes( CURRENT_USER_ID )) {
        formattedUrl = formattedUrl.replace( CURRENT_USER_ID, currentUser?.id ?? '' )
    }

    if (formattedUrl.includes( SELECT_PROFILE_EVENT_ID )) {
        formattedUrl = formattedUrl.replace(
            SELECT_PROFILE_EVENT_ID,
            currentUser?.preferences?.selectedProfile?.event.id ?? '',
        )
    }

    return formattedUrl
}

function buildHeaders (url: string, token: TokenModel | undefined, headers: HttpHeaders | undefined): HttpHeaders {
    let filledHeaders: HttpHeaders = headers ?? new HttpHeaders()

    if (PERMIT_ALL.some( (permitAll: string): boolean => url.includes( permitAll ) )) {
        return filledHeaders
    }

    filledHeaders = filledHeaders.set( AUTHORIZATION, `${token?.tokenType} ${token?.accessToken}` )
    return filledHeaders
}
