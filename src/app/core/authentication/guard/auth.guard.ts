import { inject } from '@angular/core'
import { CanActivateFn, Router, UrlTree } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { RouteHelper } from '@shared/helpers/route.helper'
import { map, Observable, of } from 'rxjs'

/**
 * Purpose: Laisse passer une route une fois l'utilisateur courant chargé, sinon envoie le visiteur vers la page de connexion.
 * Scope: Déclenche la récupération de l'utilisateur courant quand il est inconnu et l'attend.
 * Limits: Simple aide à l'usage ; le backend revérifie chaque requête.
 */
export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
    const sessionFacade: SessionFacade = inject( SessionFacade )
    const loginRoute: UrlTree = inject( Router ).parseUrl( RouteHelper.absolute( RegistryRouteEnum.LOGIN ) )
    if (GenericHelper.nonNull( sessionFacade.currentUser() )) {
        return of( true )
    }
    return sessionFacade.fetchCurrentUser().pipe(
        map( (): boolean | UrlTree => GenericHelper.nonNull( sessionFacade.currentUser() ) || loginRoute ),
    )
}
