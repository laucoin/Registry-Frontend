import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi } from '@features/auth/auth.api';
import {
	AUTH_CALLBACK_PATH,
	DEFAULT_REDIRECT_PATH,
	LOGIN_PATH,
	REDIRECT_URI_KEY,
} from '@features/auth/auth.constants';
import { AuthenticationUriModel } from '@features/auth/authentication-uri.model';
import { CurrentUserModel } from '@features/auth/current-user.model';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, map, Observable, of, pipe, ReplaySubject, share, switchMap, tap } from 'rxjs';

interface AuthState {
	currentUser: CurrentUserModel | undefined;
}

const initialState: AuthState = {
	currentUser: undefined,
};

export const AuthStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => {
		const authApi: AuthApi = inject(AuthApi);
		const router: Router = inject(Router);
		const isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

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

			fetchToken: rxMethod<string>(
				pipe(
					switchMap((authorizationCode: string) =>
						authApi
							.fetchToken({
								authorizationCode,
								redirectUri: `${location.origin}${AUTH_CALLBACK_PATH}`,
							})
							.pipe(
								switchMap(() => authApi.fetchCurrentUser()),
								catchError(() => EMPTY),
							),
					),
					tap((currentUser: CurrentUserModel): void => {
						patchState(store, { currentUser });
						const redirectUri: string =
							sessionStorage.getItem(REDIRECT_URI_KEY) ?? DEFAULT_REDIRECT_PATH;
						sessionStorage.removeItem(REDIRECT_URI_KEY);
						const isSafeRedirect: boolean =
							!redirectUri.includes(AUTH_CALLBACK_PATH) && redirectUri !== LOGIN_PATH;
						void router.navigateByUrl(isSafeRedirect ? redirectUri : DEFAULT_REDIRECT_PATH);
					}),
				),
			),

			fetchCurrentUser: rxMethod<void>(
				pipe(
					switchMap(() => fetchCurrentUserOnce().pipe(catchError(() => EMPTY))),
					tap((currentUser: CurrentUserModel): void => patchState(store, { currentUser })),
				),
			),

			checkSession(): Observable<boolean> {
				return fetchCurrentUserOnce().pipe(
					tap((currentUser: CurrentUserModel): void => patchState(store, { currentUser })),
					map((): boolean => true),
					catchError((): Observable<boolean> => of(false)),
				);
			},
		};
	}),
);
