import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { map, Observable } from 'rxjs'

export const authGuard: CanActivateFn = (): Observable<boolean> => {
    const facade: RegistryFacade = inject( RegistryFacade )
    if (GenericHelper.isNull( facade.currentUser() )) {
        facade.fetchCurrentUser()
    }
    return facade.currentUser$.pipe( map( (): boolean => true ) )
}
