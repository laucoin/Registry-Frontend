import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { map } from 'rxjs';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';

/**
 * Objectif: Construit des guards de route qui ne laissent passer que les utilisateurs ayant une autorité globale donnée.
 * Périmètre: Attend que l'utilisateur courant soit connu, puis renvoie vers l'accueil s'il n'a pas l'autorité.
 * Limites: Simple aide à l'usage ; le backend revérifie l'autorité à chaque requête.
 */
export function userAuthorityGuard(authority: UserAuthorityEnum): CanActivateFn {
	return () => {
		const sessionFacade = inject(SessionFacade);
		const router = inject(Router);

		if (GenericHelper.isNull(sessionFacade.currentUser())) {
			return sessionFacade.currentUser$.pipe(map(() => allowed(sessionFacade, router, authority)));
		}

		return allowed(sessionFacade, router, authority);
	};
}

function allowed(sessionFacade: SessionFacade, router: Router, authority: UserAuthorityEnum): boolean | UrlTree {
	return (
		CurrentUserHelper.hasUserAuthority(sessionFacade.currentUser(), authority) ||
		router.parseUrl(RegistryRouteEnum.HOME)
	);
}
