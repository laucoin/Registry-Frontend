import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '../../util-common/state/registry.facade'

export const authGuard: CanActivateFn = (): boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    if (!registryFacade.actualToken) {
        registryFacade.login()
    }

    return true
}
