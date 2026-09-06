import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpHeaders,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http'
import {inject} from '@angular/core'
import {catchError, mergeMap, Observable, throwError} from 'rxjs'
import {RegistryFacade} from '../../util-common/state/registry.facade'
import {CurrentUserModel} from '../../util-model/model/current-user.model'
import {CSRF_COOKIE, CSRF_HEADER, CURRENT_USER_ID, SELECT_PROFILE_PROJECT_ID} from '../../util-tool/util/request.util'
import {AppConfig} from '../../../app.config'
import {ErrorModel} from '../../util-model/model/error.model'
import {TranslateService} from '@ngx-translate/core'
import {SecurityService} from '../service/security.service'
import {GenericUtil} from '../../util-tool/util/generic.util'
import {CookieUtils} from '../../util-tool/util/cookie.util'

/** Reads are never CSRF-protected, so there is no token to attach to them. */
const SAFE_METHODS: readonly string[] = ['GET', 'HEAD', 'OPTIONS']

/** Renewing the session cannot itself be retried by renewing the session. */
const REFRESH_PATH: string = '/authentication/token/refresh'

export const backendHandler: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
    if (!req.url.startsWith(AppConfig.environment.backend.url)) {
        return next(req)
    }

    const registryFacade: RegistryFacade = inject(RegistryFacade)
    const securityService: SecurityService = inject(SecurityService)
    const translateService: TranslateService = inject(TranslateService)

    const currentUser: CurrentUserModel | undefined = registryFacade.currentUser()
    const url: string = formatUrlIfNeeded(currentUser, req.url)

    return next(authenticated(req, url))
        .pipe(catchError((error: HttpErrorResponse) => {
            switch (error.status) {
                case 0:
                case 502:
                case 503:
                    return throwError((): ErrorModel => ({
                        status: 503,
                        name: 'Service Unavailable',
                        title: translateService.instant('global.notifications.503.title'),
                        message: translateService.instant('global.notifications.503.message'),
                    }))
                case 401:
                    // The session cookies are HttpOnly, so whether one is still valid is not something
                    // this application can inspect — only the server can answer it. A 401 is therefore
                    // the signal to try a renewal, and a failing renewal is the signal to sign in again.
                    if (isAuthenticationCall(req.url)) {
                        registryFacade.login()
                        return throwError((): ErrorModel => new ErrorModel(error))
                    }
                    return securityService.refreshToken().pipe(
                        mergeMap((): Observable<HttpEvent<unknown>> => next(authenticated(req, url))),
                        catchError((): Observable<never> => {
                            registryFacade.login()
                            return throwError((): ErrorModel => new ErrorModel(error))
                        }),
                    )
                default:
                    return throwError((): ErrorModel => new ErrorModel(error))
            }
        }))
}

/**
 * Sends the session cookies, and the CSRF token that has to accompany any call that changes something.
 *
 * `withCredentials` is what makes the browser attach the cookies at all across origins. The CSRF header
 * is set by hand rather than through Angular's XSRF support, which only covers same-origin requests —
 * and the API is served from a sibling host.
 */
function authenticated(req: HttpRequest<unknown>, url: string): HttpRequest<unknown> {
    let headers: HttpHeaders = req.headers

    if (!SAFE_METHODS.includes(req.method)) {
        const csrfToken: string | undefined = CookieUtils.get(CSRF_COOKIE)
        if (GenericUtil.nonNull(csrfToken)) {
            headers = headers.set(CSRF_HEADER, csrfToken!)
        }
    }

    return req.clone({url: url, headers: headers, withCredentials: true})
}

function isAuthenticationCall(url: string): boolean {
    return url.includes(REFRESH_PATH)
        || AppConfig.environment.backend.noAuthPaths.some((permitAll: string): boolean => url.includes(permitAll))
}

function formatUrlIfNeeded(currentUser: CurrentUserModel | undefined, url: string): string {
    let formattedUrl: string = url

    if (formattedUrl.includes(CURRENT_USER_ID)) {
        const userId: string | undefined = currentUser?.id
        if (GenericUtil.isNull(userId)) {
            throw {
                title: 'global.notifications.NO_USER_ID.title',
                message: 'global.notifications.NO_USER_ID.message',
            } as ErrorModel
        } else {
            formattedUrl = formattedUrl.replace(CURRENT_USER_ID, userId!)
        }
    }

    if (formattedUrl.includes(SELECT_PROFILE_PROJECT_ID)) {
        const selectedProjectId: string | undefined = currentUser?.preferences?.selectedProfile?.project?.id
        if (GenericUtil.isNull(selectedProjectId)) {
            throw {
                title: 'global.notifications.NO_SELECTED_PROJECT.title',
                message: 'global.notifications.NO_SELECTED_PROJECT.message',
            } as ErrorModel
        } else {
            formattedUrl = formattedUrl.replace(SELECT_PROFILE_PROJECT_ID, selectedProjectId!)
        }
    }

    return formattedUrl
}
