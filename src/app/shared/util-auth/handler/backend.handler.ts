import { HttpEvent, HttpHandlerFn, HttpHeaders, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { Observable } from 'rxjs'
import { AppConfig } from '../../../app.config'
import { StorageEnum } from '../../model/storage.enum'
import { HeaderEnum } from '../../model/header.enum'
import { User } from 'oidc-client-ts'
import { SessionStorageUtils } from '../../util-tool/session-storage.util'

export const backendHandler: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
    if (!RegExp( AppConfig.config.backendUrl )) return next( req )

    const token: User | undefined = getToken()
    if (!token) return next( req )

    const headers: HttpHeaders = req.headers ?? new HttpHeaders()

    return next(
        req.clone( {
            headers: headers.set( HeaderEnum.AUTHORIZATION, `${token.token_type} ${token.access_token}` ),
        } ),
    )
}

function getToken (): User | undefined {
    const tokenKey: string =
        StorageEnum.TOKEN_PREFIX
                   .replace( '{{oidcUrl}}', AppConfig.config.security.oidcUrl )
                   .replace( '{{realm}}', AppConfig.config.security.realm )
                   .replace( '{{clientId}}', AppConfig.config.security.clientId )

    return SessionStorageUtils.get( tokenKey ) as User | undefined
}
