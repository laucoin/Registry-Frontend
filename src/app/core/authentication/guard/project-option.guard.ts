import { inject } from '@angular/core'
import { CanActivateFn, Router, UrlTree } from '@angular/router'
import { map, Observable } from 'rxjs'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

/**
 * Purpose: Builds route guards that only let through projects having a given option enabled.
 * Scope: Waits for the current user to be known, then checks the options of the selected project.
 * Limits: A usability aid only; the backend re-checks the option on every request.
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
