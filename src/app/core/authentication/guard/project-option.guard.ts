import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { map } from 'rxjs';

import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';

/**
 * Objectif: Construit des guards de route qui ne laissent passer que les projets ayant une option donnée activée.
 * Périmètre: Attend que l'utilisateur courant soit connu, puis vérifie les options du projet sélectionné.
 * Limites: Simple aide à l'usage ; le backend revérifie l'option à chaque requête.
 */
export function projectOptionGuard(option: ProjectOptionEnum): CanActivateFn {
	return () => {
		const sessionFacade = inject(SessionFacade);
		const router = inject(Router);

		if (GenericHelper.isNull(sessionFacade.currentUser())) {
			return sessionFacade.currentUser$.pipe(map(() => allowed(sessionFacade, router, option)));
		}

		return allowed(sessionFacade, router, option);
	};
}

function allowed(sessionFacade: SessionFacade, router: Router, option: ProjectOptionEnum): boolean | UrlTree {
	return sessionFacade.selectedProjectHasOption(option)() || router.parseUrl(RegistryRouteEnum.PROJECTS);
}

export const activityOptionGuard = projectOptionGuard(ProjectOptionEnum.ACTIVITY);
export const alertOptionGuard = projectOptionGuard(ProjectOptionEnum.ALERT);
export const vehicleOptionGuard = projectOptionGuard(ProjectOptionEnum.VEHICLE);
