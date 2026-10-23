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
import { TranslateService } from '@ngx-translate/core'
import { catchError, map, mergeMap, Observable, shareReplay, tap, throwError } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
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

export const backendHandler: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
	if (!req.url.startsWith(RegistryConfig.environment.backend.url)) {
		return next(req)
	}

	const registryFacade: RegistryFacade = inject(RegistryFacade)
	const securityApi: SecurityApi = inject(SecurityApi)
	const translateService: TranslateService = inject(TranslateService)

	const currentUser: CurrentUserModel | undefined = registryFacade.currentUser()
	const url: string = formatUrlIfNeeded(registryFacade, currentUser, req.url)
	const authenticatedReq: HttpRequest<unknown> = req.clone({
		url: url,
		withCredentials: true,
		setHeaders: csrfToken ? { [CSRF_TOKEN_HEADER]: csrfToken } : {},
	})

	return next(authenticatedReq)
		.pipe(
			tap((event: HttpEvent<unknown>): void => {
				if (event instanceof HttpResponse) {
					captureCsrfToken(event.headers)
				}
			}),
			catchError((error: HttpErrorResponse) => {
				captureCsrfToken(error.headers)

				if (RegistryConfig.environment.backend.noAuthPaths.some((permitAll: string): boolean => req.url.includes(permitAll)) && error.status === 401) {
					registryFacade.login()
					return throwError((): ErrorModel => new ErrorModel(error))
				}

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
						return refreshAccessToken(securityApi, registryFacade).pipe(
							mergeMap((): Observable<HttpEvent<unknown>> => next(authenticatedReq)),
							catchError((): Observable<HttpEvent<unknown>> => throwError((): ErrorModel => new ErrorModel(error))),
						)
					default:
						return throwError((): ErrorModel => new ErrorModel(error))
				}
			}),
		)
}

function captureCsrfToken(headers: HttpHeaders): void {
	const token: string | null = headers.get(CSRF_TOKEN_HEADER)
	if (token) {
		csrfToken = token
	}
}

function formatUrlIfNeeded(registryFacade: RegistryFacade, currentUser: CurrentUserModel | undefined, url: string): string {
	let formattedUrl: string = url

	if (formattedUrl.includes(CURRENT_USER_ID)) {
		const userId: string | undefined = currentUser?.id
		if (GenericHelper.isNull(userId)) {
			throw {
				title: 'global.notifications.NO_USER_ID.title',
				message: 'global.notifications.NO_USER_ID.message',
			} as ErrorModel
		} else {
			formattedUrl = formattedUrl.replace(CURRENT_USER_ID, userId!)
		}
	}

	if (formattedUrl.includes(SELECT_PROFILE_PROJECT_ID)) {
		const selectedProjectId: string | undefined = registryFacade.currentProjectId()
		if (GenericHelper.isNull(selectedProjectId)) {
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
