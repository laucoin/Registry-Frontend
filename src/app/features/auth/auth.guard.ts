import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthFacade } from '@features/auth/auth.facade';

export const authGuard: CanActivateFn = (): boolean => {
	const authFacade: AuthFacade = inject(AuthFacade);

	if (isPlatformBrowser(inject(PLATFORM_ID)) && !authFacade.currentUser()) {
		authFacade.ensureCurrentUser();
	}

	return true;
};
