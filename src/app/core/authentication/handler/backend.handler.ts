import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandlerFn,
	HttpHeaders,
	HttpInterceptorFn,
	HttpRequest,
	HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';
import { catchError, defer, map, mergeMap, Observable, shareReplay, tap, throwError } from 'rxjs';

import { RegistryConfig } from '@core/config/registry.config';
import { LanguageService } from '@core/language/language.service';
import { SessionFacade } from '@core/registry/state/session.facade';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { CURRENT_USER_ID, SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper';
import { ErrorModel } from '@shared/models/model/error.model';

const CSRF_TOKEN_HEADER = 'X-XSRF-TOKEN';
const ACCEPT_LANGUAGE_HEADER = 'Accept-Language';
const REFRESH_PATH = '/token/refresh';
const CREDENTIAL_FREE_PATHS = ['/api/v2/metadata/'];
let csrfToken: string | undefined;

let refreshTokenInProgress$: Observable<void> | null = null;

function abortRefresh(sessionFacade: SessionFacade, refreshError: unknown): Observable<never> {
	refreshTokenInProgress$ = null;
	sessionFacade.redirectToLogin();
	return throwError(() => refreshError);
}

function refreshAccessToken(sessionFacade: SessionFacade): Observable<void> {
	if (!refreshTokenInProgress$) {
		refreshTokenInProgress$ = sessionFacade.refreshToken().pipe(
			map((): void => undefined),
			tap({
				complete: () => {
					refreshTokenInProgress$ = null;
				},
			}),
			catchError((refreshError: unknown) => abortRefresh(sessionFacade, refreshError)),
			shareReplay(1),
		);
	}
	return refreshTokenInProgress$;
}

interface InterceptionContext {
	request: HttpRequest<unknown>;
	authenticatedRequest: HttpRequest<unknown>;
	next: HttpHandlerFn;
	sessionFacade: SessionFacade;
	translateService: TranslocoService;
}

const UNAVAILABLE_STATUSES = [0, 502, 503];

/**
 * Objectif: Intercepteur HTTP unique pour chaque requête vers le backend.
 * Périmètre: Ajoute les identifiants (sauf sur les endpoints de métadonnées publics, pour que le backend saute l'authentification), le jeton CSRF et la langue d'affichage, résout les placeholders d'url, rafraîchit le jeton une fois sur un 401 puis rejoue, et mappe 0/502/503 vers une erreur de service indisponible.
 * Limites: Ne touche pas aux autres origines ; l'endpoint de rafraîchissement et les chemins sans authentification ne sont jamais rafraîchis ni rejoués. Ne conserve que le jeton CSRF des réponses authentifiées : le backend le dérive du jeton d'accès, il n'a donc aucun sens sur les requêtes envoyées sans identifiants.
 */
export const backendHandler: HttpInterceptorFn = (req, next) => {
	if (!isBackendUrl(req.url)) {
		return next(req);
	}

	const sessionFacade = inject(SessionFacade);
	const translateService = inject(TranslocoService);
	const languageService = inject(LanguageService);

	return defer(() => intercept(req, next, sessionFacade, translateService, languageService.activeLanguage));
};

function intercept(
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
	sessionFacade: SessionFacade,
	translateService: TranslocoService,
	language: string,
): Observable<HttpEvent<unknown>> {
	const authenticatedRequest = authenticate(req, sessionFacade, language);
	const context: InterceptionContext = { request: req, authenticatedRequest, next, sessionFacade, translateService };
	return next(authenticatedRequest).pipe(
		tap((event) => captureCsrfTokenFromEvent(event, authenticatedRequest)),
		catchError((error: HttpErrorResponse) => handleError(error, context)),
	);
}

function isBackendUrl(url: string): boolean {
	const base = RegistryConfig.environment.backend.url.replace(/\/+$/, '');
	return url === base || ['/', '?', '#'].some((separator) => url.startsWith(`${base}${separator}`));
}

function authenticate(req: HttpRequest<unknown>, sessionFacade: SessionFacade, language: string): HttpRequest<unknown> {
	const url = formatUrlIfNeeded(sessionFacade, req.url);
	const localizedRequest = req.clone({
		url: url,
		withCredentials: !isCredentialFree(url),
		setHeaders: { [ACCEPT_LANGUAGE_HEADER]: language },
	});
	return withCsrfToken(localizedRequest);
}

function isCredentialFree(url: string): boolean {
	return CREDENTIAL_FREE_PATHS.some((path) => url.startsWith(`${RegistryConfig.environment.backend.url}${path}`));
}

function withCsrfToken(req: HttpRequest<unknown>): HttpRequest<unknown> {
	return csrfToken ? req.clone({ setHeaders: { [CSRF_TOKEN_HEADER]: csrfToken } }) : req;
}

function handleError(error: HttpErrorResponse, context: InterceptionContext): Observable<HttpEvent<unknown>> {
	if (context.authenticatedRequest.withCredentials) captureCsrfToken(error.headers);

	if (error.status === 401 && isNoAuthPath(context.request.url)) {
		// L'échec du rafraîchissement envoie déjà l'utilisateur vers la connexion dans refreshAccessToken.
		if (!context.request.url.includes(REFRESH_PATH)) context.sessionFacade.redirectToLogin();
		return throwError(() => new ErrorModel(error));
	}
	if (error.status === 401) {
		return refreshAndReplay(error, context);
	}
	return throwError(() => toBackendError(error, context.translateService));
}

function refreshAndReplay(error: HttpErrorResponse, context: InterceptionContext): Observable<HttpEvent<unknown>> {
	return refreshAccessToken(context.sessionFacade).pipe(
		catchError(() => throwError(() => new ErrorModel(error))),
		mergeMap(() => replay(context)),
	);
}

function replay(context: InterceptionContext): Observable<HttpEvent<unknown>> {
	return context.next(withCsrfToken(context.authenticatedRequest)).pipe(
		tap((event) => captureCsrfTokenFromEvent(event, context.authenticatedRequest)),
		catchError((error: HttpErrorResponse) => throwError(() => toBackendError(error, context.translateService))),
	);
}

function isNoAuthPath(url: string): boolean {
	return RegistryConfig.environment.backend.noAuthPaths.some((noAuthPath) => url.includes(noAuthPath));
}

function toBackendError(error: HttpErrorResponse, translateService: TranslocoService): ErrorModel {
	return UNAVAILABLE_STATUSES.includes(error.status) ? unavailableError(translateService) : new ErrorModel(error);
}

function unavailableError(translateService: TranslocoService): ErrorModel {
	return {
		status: 503,
		name: 'Service Unavailable',
		title: translateService.translate('global.notifications.503.title'),
		message: translateService.translate('global.notifications.503.message'),
	};
}

function captureCsrfTokenFromEvent(event: HttpEvent<unknown>, request: HttpRequest<unknown>): void {
	if (event instanceof HttpResponse && request.withCredentials) {
		captureCsrfToken(event.headers);
	}
}

function captureCsrfToken(headers: HttpHeaders): void {
	const token = headers.get(CSRF_TOKEN_HEADER);
	if (token) {
		csrfToken = token;
	}
}

function formatUrlIfNeeded(sessionFacade: SessionFacade, url: string): string {
	const urlWithUserId = replacePlaceholder(url, CURRENT_USER_ID, () => sessionFacade.currentUser()?.id, 'NO_USER_ID');
	return replacePlaceholder(
		urlWithUserId,
		SELECT_PROFILE_PROJECT_ID,
		() => sessionFacade.currentProjectId(),
		'NO_SELECTED_PROJECT',
	);
}

function replacePlaceholder(
	url: string,
	placeholder: string,
	readValue: () => string | undefined,
	errorKey: string,
): string {
	if (!url.includes(placeholder)) {
		return url;
	}
	const value = readValue();
	if (GenericHelper.isNull(value)) {
		throw missingValueError(errorKey);
	}
	return url.replace(placeholder, value);
}

function missingValueError(errorKey: string): ErrorModel {
	return {
		title: `global.notifications.${errorKey}.title`,
		message: `global.notifications.${errorKey}.message`,
	} as ErrorModel;
}
