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
import { LanguageService } from '@core/language/language.service'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { CURRENT_USER_ID, SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'

const CSRF_TOKEN_HEADER: string = 'X-XSRF-TOKEN'
const ACCEPT_LANGUAGE_HEADER: string = 'Accept-Language'
const REFRESH_PATH: string = '/token/refresh'
const CREDENTIAL_FREE_PATHS: string[] = ['/api/v2/metadata/']
let csrfToken: string | undefined

let refreshTokenInProgress$: Observable<void> | null = null

function refreshAccessToken(sessionFacade: SessionFacade): Observable<void> {
	if (!refreshTokenInProgress$) {
		refreshTokenInProgress$ = sessionFacade.refreshToken().pipe(
			map((): void => undefined),
			tap({
				complete: (): void => {
					refreshTokenInProgress$ = null
				}
			}),
			catchError((refreshError: unknown): Observable<never> => {
				refreshTokenInProgress$ = null
				sessionFacade.redirectToLogin()
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
	sessionFacade: SessionFacade
	translateService: TranslocoService
}

const UNAVAILABLE_STATUSES: number[] = [0, 502, 503]

/**
 * Purpose: Single HTTP interceptor for every request to the backend.
 * Scope: Adds credentials (except on the public metadata endpoints, so the backend skips authentication), the CSRF token and the display language, resolves url placeholders, refreshes the token once on a 401 then replays, and maps 0/502/503 to a service unavailable error.
 * Limits: Does not touch other origins; the refresh endpoint and the no-auth paths are never refreshed or replayed. Keeps the CSRF token of authenticated responses only: the backend derives it from the access token, so it is meaningless on the requests sent without credentials.
 */
export const backendHandler: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
	if (!isBackendUrl(req.url)) {
		return next(req)
	}

	const sessionFacade: SessionFacade = inject(SessionFacade)
	const translateService: TranslocoService = inject(TranslocoService)
	const languageService: LanguageService = inject(LanguageService)

	return defer((): Observable<HttpEvent<unknown>> => {
		const authenticatedRequest: HttpRequest<unknown> = authenticate(req, sessionFacade, languageService.activeLanguage)
		const context: InterceptionContext = { request: req, authenticatedRequest, next, sessionFacade, translateService }
		return next(authenticatedRequest).pipe(
			tap((event: HttpEvent<unknown>): void => captureCsrfTokenFromEvent(event, authenticatedRequest)),
			catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => handleError(error, context)),
		)
	})
}

function isBackendUrl(url: string): boolean {
	const base: string = RegistryConfig.environment.backend.url.replace(/\/+$/, '')
	return url === base || ['/', '?', '#'].some((separator: string): boolean => url.startsWith(`${base}${separator}`))
}

function authenticate(req: HttpRequest<unknown>, sessionFacade: SessionFacade, language: string): HttpRequest<unknown> {
	const url: string = formatUrlIfNeeded(sessionFacade, req.url)
	const localizedRequest: HttpRequest<unknown> = req.clone({
		url: url,
		withCredentials: !isCredentialFree(url),
		setHeaders: { [ACCEPT_LANGUAGE_HEADER]: language },
	})
	return withCsrfToken(localizedRequest)
}

function isCredentialFree(url: string): boolean {
	return CREDENTIAL_FREE_PATHS.some((path: string): boolean => url.startsWith(`${RegistryConfig.environment.backend.url}${path}`))
}

function withCsrfToken(req: HttpRequest<unknown>): HttpRequest<unknown> {
	return csrfToken ? req.clone({ setHeaders: { [CSRF_TOKEN_HEADER]: csrfToken } }) : req
}

function handleError(error: HttpErrorResponse, context: InterceptionContext): Observable<HttpEvent<unknown>> {
	if (context.authenticatedRequest.withCredentials) captureCsrfToken(error.headers)

	if (error.status === 401 && isNoAuthPath(context.request.url)) {
		// The refresh failure already sends the user to the login in refreshAccessToken.
		if (!context.request.url.includes(REFRESH_PATH)) context.sessionFacade.redirectToLogin()
		return throwError((): ErrorModel => new ErrorModel(error))
	}
	if (error.status === 401) {
		return refreshAndReplay(error, context)
	}
	return throwError((): ErrorModel => toBackendError(error, context.translateService))
}

function refreshAndReplay(error: HttpErrorResponse, context: InterceptionContext): Observable<HttpEvent<unknown>> {
	return refreshAccessToken(context.sessionFacade).pipe(
		catchError((): Observable<never> => throwError((): ErrorModel => new ErrorModel(error))),
		mergeMap((): Observable<HttpEvent<unknown>> => replay(context)),
	)
}

function replay(context: InterceptionContext): Observable<HttpEvent<unknown>> {
	return context.next(withCsrfToken(context.authenticatedRequest)).pipe(
		tap((event: HttpEvent<unknown>): void => captureCsrfTokenFromEvent(event, context.authenticatedRequest)),
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

function captureCsrfTokenFromEvent(event: HttpEvent<unknown>, request: HttpRequest<unknown>): void {
	if (event instanceof HttpResponse && request.withCredentials) {
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
