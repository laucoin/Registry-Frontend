import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi } from '@core/auth/auth.api';
import {
	AUTH_CALLBACK_ROUTE,
	DEFAULT_REDIRECT_ROUTE,
	LOGIN_ROUTE,
	REDIRECT_URI_KEY,
} from '@core/auth/auth-routes.constants';
import { GlobalErrorFacade } from '@core/error/global-error.facade';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { AuthenticationUriModel } from '@shared/models/authentication-uri.model';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { SessionStorageService, StorageEngine } from 'ngx-oneforall/services/storage';
import {
	catchError,
	EMPTY,
	map,
	Observable,
	of,
	pipe,
	ReplaySubject,
	share,
	switchMap,
	tap,
} from 'rxjs';

function isUnauthenticated(error: unknown): boolean {
	return error instanceof HttpErrorResponse && error.status === 401;
}

interface AuthState {
	currentUser: CurrentUserModel | undefined;
}

const initialState: AuthState = {
	currentUser: undefined,
};

/**
 * Purpose: Holds the shared, app-wide current-user state and the state-changing auth operations
 * (logout, token fetch, current-user fetch, session check).
 * Scope: Calls AuthApi and caches the in-flight current-user request for the page lifetime to avoid
 * duplicate calls tripping the backend's rate limiter.
 * Limits: Never injected directly by components/guards/interceptors — always accessed through AuthFacade.
 */
export const AuthStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => {
		const authApi: AuthApi = inject(AuthApi);
		const router: Router = inject(Router);
		const isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));
		const sessionStorage: StorageEngine = inject(SessionStorageService);
		const globalErrorFacade: GlobalErrorFacade = inject(GlobalErrorFacade);

		// Cached for the whole page lifetime, success or failure (resetOnError/resetOnComplete:
		// false): authGuard and guestGuard each call this independently, and without a permanent
		// cache an anonymous visit fires two full current-user + refresh-token round trips back to
		// back, enough to trip the backend's auth rate limiter (429s). logout() below clears it —
		// otherwise a stale success would keep being replayed after signing out.
		let currentUserRequest$: Observable<CurrentUserModel> | null = null;

		function fetchCurrentUserOnce(): Observable<CurrentUserModel> {
			if (!currentUserRequest$) {
				currentUserRequest$ = authApi.fetchCurrentUser().pipe(
					share({
						connector: () => new ReplaySubject(1),
						resetOnError: false,
						resetOnComplete: false,
						resetOnRefCountZero: false,
					}),
				);
			}
			return currentUserRequest$;
		}

		return {
			logout(): void {
				if (!isBrowser) {
					return;
				}
				authApi.getLogoutUri(location.origin).subscribe({
					next: (uri: AuthenticationUriModel): void => {
						currentUserRequest$ = null;
						patchState(store, { currentUser: undefined });
						window.location.href = uri.uri;
					},
				});
			},

			fetchToken: rxMethod<string | undefined>(
				pipe(
					switchMap((authorizationCode: string | undefined) => {
						if (!authorizationCode) {
							globalErrorFacade.reportTokenExchangeFailure();
							return EMPTY;
						}
						return authApi
							.fetchToken({
								authorizationCode,
								redirectUri: `${location.origin}${AUTH_CALLBACK_ROUTE}`,
							})
							.pipe(
								switchMap(() => authApi.fetchCurrentUser()),
								catchError((error: unknown) => {
									if (!isUnauthenticated(error)) {
										globalErrorFacade.reportTokenExchangeFailure();
									}
									return EMPTY;
								}),
							);
					}),
					tap((currentUser: CurrentUserModel): void => {
						patchState(store, { currentUser });
						const redirectUri: string =
							sessionStorage.get(REDIRECT_URI_KEY) ?? DEFAULT_REDIRECT_ROUTE;
						sessionStorage.remove(REDIRECT_URI_KEY);
						const isSafeRedirect: boolean =
							!redirectUri.includes(AUTH_CALLBACK_ROUTE) && redirectUri !== LOGIN_ROUTE;
						void router.navigateByUrl(isSafeRedirect ? redirectUri : DEFAULT_REDIRECT_ROUTE);
					}),
				),
			),

			fetchCurrentUser: rxMethod<void>(
				pipe(
					switchMap(() =>
						fetchCurrentUserOnce().pipe(
							catchError((error: unknown) => {
								if (!isUnauthenticated(error)) {
									globalErrorFacade.reportSessionCheckFailure();
								}
								return EMPTY;
							}),
						),
					),
					tap((currentUser: CurrentUserModel): void => patchState(store, { currentUser })),
				),
			),

			checkSession(): Observable<boolean> {
				return fetchCurrentUserOnce().pipe(
					tap((currentUser: CurrentUserModel): void => patchState(store, { currentUser })),
					map((): boolean => true),
					catchError((error: unknown): Observable<boolean> => {
						if (!isUnauthenticated(error)) {
							globalErrorFacade.reportSessionCheckFailure();
						}
						return of(false);
					}),
				);
			},
		};
	}),
);
