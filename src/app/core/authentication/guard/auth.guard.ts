import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { GenericUtil } from '@shared/helpers/util/generic.util'
import { map, Observable } from 'rxjs'

export const authGuard: CanActivateFn = (): Observable<boolean> => {
    const facade: RegistryFacade = inject( RegistryFacade )
    if (GenericUtil.isNull( facade.currentUser() )) {
        facade.fetchCurrentUser()
    }
    return facade.currentUser$.pipe( map( (): boolean => true ) )
}
