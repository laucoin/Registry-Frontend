import { inject } from '@angular/core'
import { CanActivateFn, Router, UrlTree } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { map, Observable, of } from 'rxjs'

/**
 * Purpose: Lets a route through once the current user is loaded, otherwise sends the visitor to the login page.
 * Scope: Triggers the current user fetch when the user is unknown and waits for it.
 * Limits: A usability aid only; the backend re-checks every request.
 */
export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
    const facade: RegistryFacade = inject( RegistryFacade )
    const sessionFacade: SessionFacade = inject( SessionFacade )
    const loginRoute: UrlTree = inject( Router ).parseUrl( `/${RegistryRouteEnum.LOGIN}` )
    if (GenericHelper.nonNull( sessionFacade.currentUser() )) {
        return of( true )
    }
    return facade.fetchCurrentUser().pipe(
        map( (): boolean | UrlTree => GenericHelper.nonNull( sessionFacade.currentUser() ) || loginRoute ),
    )
}
