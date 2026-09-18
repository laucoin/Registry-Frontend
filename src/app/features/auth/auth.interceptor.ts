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
import { Router } from '@angular/router';
import { LOGIN_PATH } from '@features/auth/auth.constants';
import { AuthFacade } from '@features/auth/auth.facade';
import { ConfigFacade } from '@features/config/config.facade';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import { catchError, mergeMap, Observable, shareReplay, tap, throwError } from 'rxjs';

const CSRF_TOKEN_HEADER: string = 'X-XSRF-TOKEN';
let csrfToken: string | undefined;

const NO_AUTH_PATHS: readonly string[] = [
	'/authentication/login/uri',
	'/authentication/logout/uri',
	'/authentication/token',
];

let refreshTokenInProgress$: Observable<void> | null = null;

function refreshAccessToken(authFacade: AuthFacade, router: Router): Observable<void> {
	if (!refreshTokenInProgress$) {
		refreshTokenInProgress$ = authFacade.refreshToken().pipe(
			tap({
				complete: (): void => {
					refreshTokenInProgress$ = null;
				},
			}),
			catchError((refreshError: unknown): Observable<never> => {
				refreshTokenInProgress$ = null;
				setTimeout((): void => void router.navigateByUrl(LOGIN_PATH));
				return throwError((): unknown => refreshError);
			}),
			shareReplay(1),
		);
	}
	return refreshTokenInProgress$;
}

export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
	const config: RuntimeConfigModel | undefined = inject(ConfigFacade).config();
	if (!config || !req.url.startsWith(config.backend.url)) {
		return next(req);
	}

	const authFacade: AuthFacade = inject(AuthFacade);
	const router: Router = inject(Router);

	const authenticatedReq: HttpRequest<unknown> = req.clone({
		withCredentials: true,
		setHeaders: csrfToken ? { [CSRF_TOKEN_HEADER]: csrfToken } : {},
	});

	return next(authenticatedReq).pipe(
		tap((event: HttpEvent<unknown>): void => {
			if (event instanceof HttpResponse) {
				captureCsrfToken(event.headers);
			}
		}),
		catchError((error: HttpErrorResponse) => {
			captureCsrfToken(error.headers);

			switch (error.status) {
				case 0:
				case 502:
				case 503:
					return throwError((): Error => new Error('Service indisponible, réessayez plus tard.'));
				case 401:
					if (NO_AUTH_PATHS.some((path: string): boolean => authenticatedReq.url.includes(path))) {
						setTimeout((): void => void router.navigateByUrl(LOGIN_PATH));
						return throwError((): HttpErrorResponse => error);
					}
					return refreshAccessToken(authFacade, router).pipe(
						mergeMap((): Observable<HttpEvent<unknown>> => next(authenticatedReq)),
						catchError((): Observable<HttpEvent<unknown>> =>
							throwError((): HttpErrorResponse => error),
						),
					);
				default:
					return throwError((): HttpErrorResponse => error);
			}
		}),
	);
};

function captureCsrfToken(headers: HttpHeaders): void {
	const token: string | null = headers.get(CSRF_TOKEN_HEADER);
	if (token) {
		csrfToken = token;
	}
}
