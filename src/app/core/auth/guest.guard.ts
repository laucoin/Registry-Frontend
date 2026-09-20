import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';
import { map, Observable } from 'rxjs';

/**
 * Purpose: Route guard for auth-only pages (e.g. login) — redirects an already-authenticated user away.
 * Scope: Passes through unconditionally during SSR (session check needs the browser); resolves via
 * AuthFacade.checkSession() on the client.
 * Limits: Not a security boundary — only a UX redirect; the backend still enforces access on every request.
 */
export const guestGuard: CanActivateFn = (): boolean | UrlTree | Observable<boolean | UrlTree> => {
	if (!isPlatformBrowser(inject(PLATFORM_ID))) {
		return true;
	}

	const authFacade: AuthFacade = inject(AuthFacade);
	const router: Router = inject(Router);

	if (authFacade.currentUser()) {
		return router.parseUrl('/');
	}

	return authFacade
		.checkSession()
		.pipe(
			map((isAuthenticated: boolean): boolean | UrlTree =>
				isAuthenticated ? router.parseUrl('/') : true,
			),
		);
};
