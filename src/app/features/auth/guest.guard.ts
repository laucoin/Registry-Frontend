import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@features/auth/auth.facade';
import { map, Observable } from 'rxjs';

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
