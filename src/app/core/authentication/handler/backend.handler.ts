import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpHeaders,
    HttpInterceptorFn,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http'
import { inject } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'
import { catchError, defer, map, mergeMap, Observable, shareReplay, tap, throwError } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { CURRENT_USER_ID, SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'
import { SecurityApi } from '@core/authentication/service/security.api'

const CSRF_TOKEN_HEADER: string = 'X-XSRF-TOKEN'
let csrfToken: string | undefined

let refreshTokenInProgress$: Observable<void> | null = null

function refreshAccessToken(securityApi: SecurityApi, registryFacade: RegistryFacade): Observable<void> {
	if (!refreshTokenInProgress$) {
		refreshTokenInProgress$ = securityApi.refreshToken().pipe(
			map((): void => undefined),
			tap({
				complete: (): void => {
					refreshTokenInProgress$ = null
				}
			}),
			catchError((refreshError: unknown): Observable<never> => {
				refreshTokenInProgress$ = null
				registryFacade.login()
				return throwError((): unknown => refreshError)
			}),
			shareReplay(1),
		)
	}
	return refreshTokenInProgress$
}

interface InterceptionContext {
	request: HttpRequest<unknown>
	authenticatedRequest: HttpRequest<unknown>
	next: HttpHandlerFn
	registryFacade: RegistryFacade
	securityApi: SecurityApi
	translateService: TranslocoService
}

const UNAVAILABLE_STATUSES: number[] = [0, 502, 503]

export const backendHandler: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
	if (!req.url.startsWith(RegistryConfig.environment.backend.url)) {
		return next(req)
	}

	const registryFacade: RegistryFacade = inject(RegistryFacade)
	const sessionFacade: SessionFacade = inject(SessionFacade)
	const securityApi: SecurityApi = inject(SecurityApi)
	const translateService: TranslocoService = inject(TranslocoService)

	return defer((): Observable<HttpEvent<unknown>> => {
		const authenticatedRequest: HttpRequest<unknown> = authenticate(req, sessionFacade)
		const context: InterceptionContext = { request: req, authenticatedRequest, next, registryFacade, securityApi, translateService }
		return next(authenticatedRequest).pipe(
			tap(captureCsrfTokenFromEvent),
			catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => handleError(error, context)),
		)
	})
}

function authenticate(req: HttpRequest<unknown>, sessionFacade: SessionFacade): HttpRequest<unknown> {
	const url: string = formatUrlIfNeeded(sessionFacade, req.url)
	return withCsrfToken(req.clone({ url: url, withCredentials: true }))
}

function withCsrfToken(req: HttpRequest<unknown>): HttpRequest<unknown> {
	return csrfToken ? req.clone({ setHeaders: { [CSRF_TOKEN_HEADER]: csrfToken } }) : req
}

function handleError(error: HttpErrorResponse, context: InterceptionContext): Observable<HttpEvent<unknown>> {
	captureCsrfToken(error.headers)

	if (error.status === 401 && isNoAuthPath(context.request.url)) {
		context.registryFacade.login()
		return throwError((): ErrorModel => new ErrorModel(error))
	}
	if (error.status === 401) {
		return refreshAndReplay(error, context)
	}
	return throwError((): ErrorModel => toBackendError(error, context.translateService))
}

function refreshAndReplay(error: HttpErrorResponse, context: InterceptionContext): Observable<HttpEvent<unknown>> {
	return refreshAccessToken(context.securityApi, context.registryFacade).pipe(
		catchError((): Observable<never> => throwError((): ErrorModel => new ErrorModel(error))),
		mergeMap((): Observable<HttpEvent<unknown>> => replay(context)),
	)
}

function replay(context: InterceptionContext): Observable<HttpEvent<unknown>> {
	return context.next(withCsrfToken(context.authenticatedRequest)).pipe(
		tap(captureCsrfTokenFromEvent),
		catchError((error: HttpErrorResponse): Observable<never> => throwError((): ErrorModel => toBackendError(error, context.translateService))),
	)
}

function isNoAuthPath(url: string): boolean {
	return RegistryConfig.environment.backend.noAuthPaths.some((noAuthPath: string): boolean => url.includes(noAuthPath))
}

function toBackendError(error: HttpErrorResponse, translateService: TranslocoService): ErrorModel {
	return UNAVAILABLE_STATUSES.includes(error.status) ? unavailableError(translateService) : new ErrorModel(error)
}

function unavailableError(translateService: TranslocoService): ErrorModel {
	return {
		status: 503,
		name: 'Service Unavailable',
		title: translateService.translate('global.notifications.503.title'),
		message: translateService.translate('global.notifications.503.message'),
	}
}

function captureCsrfTokenFromEvent(event: HttpEvent<unknown>): void {
	if (event instanceof HttpResponse) {
		captureCsrfToken(event.headers)
	}
}

function captureCsrfToken(headers: HttpHeaders): void {
	const token: string | null = headers.get(CSRF_TOKEN_HEADER)
	if (token) {
		csrfToken = token
	}
}

function formatUrlIfNeeded(sessionFacade: SessionFacade, url: string): string {
	const urlWithUserId: string = replacePlaceholder(url, CURRENT_USER_ID, () => sessionFacade.currentUser()?.id, 'NO_USER_ID')
	return replacePlaceholder(urlWithUserId, SELECT_PROFILE_PROJECT_ID, () => sessionFacade.currentProjectId(), 'NO_SELECTED_PROJECT')
}

function replacePlaceholder(url: string, placeholder: string, readValue: () => string | undefined, errorKey: string): string {
	if (!url.includes(placeholder)) {
		return url
	}
	const value: string | undefined = readValue()
	if (GenericHelper.isNull(value)) {
		throw missingValueError(errorKey)
	}
	return url.replace(placeholder, value!)
}

function missingValueError(errorKey: string): ErrorModel {
	return {
		title: `global.notifications.${errorKey}.title`,
		message: `global.notifications.${errorKey}.message`,
	} as ErrorModel
}
