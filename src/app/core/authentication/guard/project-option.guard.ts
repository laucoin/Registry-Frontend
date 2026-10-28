import { inject } from '@angular/core'
import { CanActivateFn, Router, UrlTree } from '@angular/router'
import { map, Observable } from 'rxjs'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

/**
 * Purpose: Construit des guards de route qui ne laissent passer que les projets ayant une option donnée activée.
 * Scope: Attend que l'utilisateur courant soit connu, puis vérifie les options du projet sélectionné.
 * Limits: Simple aide à l'usage ; le backend revérifie l'option à chaque requête.
 */
export function projectOptionGuard (option: ProjectOptionEnum): CanActivateFn {
    return (): Observable<boolean | UrlTree> | boolean | UrlTree => {
        const sessionFacade: SessionFacade = inject( SessionFacade )
        const router: Router = inject( Router )

        if (GenericHelper.isNull( sessionFacade.currentUser() )) {
            return sessionFacade.currentUser$.pipe( map( (): boolean | UrlTree => allowed( sessionFacade, router, option ) ) )
        }

        return allowed( sessionFacade, router, option )
    }
}

function allowed (sessionFacade: SessionFacade, router: Router, option: ProjectOptionEnum): boolean | UrlTree {
    return sessionFacade.selectedProjectHasOption( option )() || router.parseUrl( RegistryRouteEnum.PROJECTS )
}

export const activityOptionGuard: CanActivateFn = projectOptionGuard( ProjectOptionEnum.ACTIVITY )
export const alertOptionGuard: CanActivateFn = projectOptionGuard( ProjectOptionEnum.ALERT )
export const vehicleOptionGuard: CanActivateFn = projectOptionGuard( ProjectOptionEnum.VEHICLE )
