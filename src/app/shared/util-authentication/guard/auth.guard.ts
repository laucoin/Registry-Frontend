import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { map, Observable } from 'rxjs'

export const authGuard: CanActivateFn = (): Observable<boolean> => {
    const facade: RegistryFacade = inject( RegistryFacade )
    if (GenericUtil.isNull( facade.token() )) {
        facade.restoreSessionFromStorage()
    }
    if (GenericUtil.isNull( facade.currentUser() )) {
        facade.fetchCurrentUser()
    }
    return facade.currentUser$.pipe( map( (): boolean => true ) )
}
