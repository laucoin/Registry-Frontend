import { inject, Injectable, Signal } from '@angular/core';
import { AuthApi } from '@core/auth/auth.api';
import {
	AUTH_CALLBACK_ROUTE,
	LOGIN_ROUTE,
	REDIRECT_URI_KEY,
} from '@core/auth/auth-routes.constants';
import { AuthStore } from '@core/auth/auth.store';
import { AuthenticationUriModel } from '@shared/models/authentication-uri.model';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { OnlyInBrowser } from 'ngx-oneforall/decorators/only-in-browser';
import { SessionStorageService, StorageEngine } from 'ngx-oneforall/services/storage';
import { Observable } from 'rxjs';

/**
 * Purpose: Sole public entry point for the auth domain — exposes current-user state and login/logout/token operations.
 * Scope: Forwards persisted/shared calls to AuthStore and calls AuthApi directly for one-shot calls with nothing to persist.
 * Limits: Implements no HTTP or state logic itself; only orchestrates AuthStore and AuthApi.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
	private readonly _store: InstanceType<typeof AuthStore> = inject(AuthStore);
	private readonly _api: AuthApi = inject(AuthApi);
	private readonly _sessionStorage: StorageEngine = inject(SessionStorageService);

	public readonly currentUser: Signal<CurrentUserModel | undefined> = this._store.currentUser;

	@OnlyInBrowser()
	public login(): void {
		if (location.pathname !== LOGIN_ROUTE) {
			this._sessionStorage.set(REDIRECT_URI_KEY, location.pathname);
		}
		this._api.getLoginUri(`${location.origin}${AUTH_CALLBACK_ROUTE}`).subscribe({
			next: (uri: AuthenticationUriModel): void => {
				window.location.href = uri.uri;
			},
		});
	}

	public logout(): void {
		this._store.logout();
	}

	public fetchToken(authorizationCode: string | undefined): void {
		this._store.fetchToken(authorizationCode);
	}

	public ensureCurrentUser(): void {
		this._store.fetchCurrentUser();
	}

	public checkSession(): Observable<boolean> {
		return this._store.checkSession();
	}

	public refreshToken(): Observable<void> {
		return this._api.refreshToken();
	}
}
