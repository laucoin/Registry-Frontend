import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { map, Observable } from 'rxjs'

/**
 * Purpose: Lets a route through once the current user is loaded.
 * Scope: Triggers the current user fetch when the user is unknown and waits for it.
 * Limits: A usability aid only; the backend re-checks every request.
 */
export const authGuard: CanActivateFn = (): Observable<boolean> => {
    const facade: RegistryFacade = inject( RegistryFacade )
    const sessionFacade: SessionFacade = inject( SessionFacade )
    if (GenericHelper.isNull( sessionFacade.currentUser() )) {
        facade.fetchCurrentUser()
    }
    return sessionFacade.currentUser$.pipe( map( (): boolean => true ) )
}
