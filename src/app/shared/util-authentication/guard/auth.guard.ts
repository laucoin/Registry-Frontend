import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { TokenModel } from '../model/token.model'

export const authGuard: CanActivateFn = (): Promise<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    const token: TokenModel | undefined = registryFacade.actualToken
    if (!token) {
        registryFacade.fetchToken()
    }

    return true
}
