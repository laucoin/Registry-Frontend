import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';

/**
 * Purpose: Triggers a background current-user fetch on first browser navigation, without blocking the route.
 * Scope: Always returns true; only calls AuthFacade.ensureCurrentUser() in the browser when no user is loaded yet.
 * Limits: Not a security boundary — only warms client state; the backend re-checks every condition.
 */
export const authGuard: CanActivateFn = (): boolean => {
	const authFacade: AuthFacade = inject(AuthFacade);

	if (isPlatformBrowser(inject(PLATFORM_ID)) && !authFacade.currentUser()) {
		authFacade.ensureCurrentUser();
	}

	return true;
};
