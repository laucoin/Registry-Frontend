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

export const backendHandler: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    const token: TokenModel | undefined = registryFacade.actualToken
    const headers: HttpHeaders = buildHeaders( token, req.headers )

    const currentUser: CurrentUserModel | undefined = registryFacade.actualCurrentUser
    const url: string = formatUrlIfNecessary( currentUser, req.url )

    return next( req.clone( { url: url, headers: headers } ) )
        .pipe( catchError( (error: HttpErrorResponse) => {
            switch (error.status) {
                case 0:
                    return throwError( (): HttpErrorResponse => new HttpErrorResponse( { status: 503 } ) )
                case 401:
                    return registryFacade.refreshToken().pipe(
                        map( (): TokenModel => registryFacade.actualToken! ),
                        mergeMap( (newToken: TokenModel): Observable<HttpEvent<unknown>> => {
                            const retryHeaders: HttpHeaders = buildHeaders( newToken, req.headers )
                            return next( req.clone( { url: url, headers: retryHeaders } ) )
                        } ),
                        catchError( (retryError: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
                            if (retryError.status === 401) {
                                SessionStorageUtils.set( REDIRECT_URI, location.pathname )
                                registryFacade.login()
                            }
                            return throwError( (): HttpErrorResponse => retryError )
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

function buildHeaders (token: TokenModel | undefined, headers: HttpHeaders | undefined): HttpHeaders {
    let filledHeaders: HttpHeaders = headers ?? new HttpHeaders()

    filledHeaders = filledHeaders.set( AUTHORIZATION, `${token?.tokenType} ${token?.accessToken}` )

    return filledHeaders
}
