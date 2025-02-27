import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { SessionStorageUtils } from '../../util-tool/util/session-storage.util'
import { REDIRECT_URI } from '../../util-tool/util/request.util'

export const authGuard: CanActivateFn = (): boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    if (!registryFacade.token()) {
        SessionStorageUtils.set( REDIRECT_URI, location.pathname )
        registryFacade.login()
    }

    return true
}
