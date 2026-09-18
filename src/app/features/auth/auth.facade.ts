import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, Signal } from '@angular/core';
import { AuthApi } from '@features/auth/auth.api';
import { AUTH_CALLBACK_PATH, LOGIN_PATH, REDIRECT_URI_KEY } from '@features/auth/auth.constants';
import { AuthStore } from '@features/auth/auth.store';
import { AuthenticationUriModel } from '@features/auth/authentication-uri.model';
import { CurrentUserModel } from '@features/auth/current-user.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
	private readonly store: InstanceType<typeof AuthStore> = inject(AuthStore);
	private readonly api: AuthApi = inject(AuthApi);
	private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

	public readonly currentUser: Signal<CurrentUserModel | undefined> = this.store.currentUser;

	public login(): void {
		if (!this.isBrowser) {
			return;
		}
		if (location.pathname !== LOGIN_PATH) {
			sessionStorage.setItem(REDIRECT_URI_KEY, location.pathname);
		}
		this.api.getLoginUri(`${location.origin}${AUTH_CALLBACK_PATH}`).subscribe({
			next: (uri: AuthenticationUriModel): void => {
				window.location.href = uri.uri;
			},
		});
	}

	public logout(): void {
		this.store.logout();
	}

	public fetchToken(authorizationCode: string): void {
		this.store.fetchToken(authorizationCode);
	}

	public ensureCurrentUser(): void {
		this.store.fetchCurrentUser();
	}

	public checkSession(): Observable<boolean> {
		return this.store.checkSession();
	}

	public refreshToken(): Observable<void> {
		return this.api.refreshToken();
	}
}
