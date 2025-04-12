import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AppRouteEnum } from '../../../app-route.enum'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { SelectItem } from 'primeng/api'

export const vehicleOptionGuard: CanActivateFn = (): Promise<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )
    const router: Router = inject( Router )

    const currentUser: CurrentUserModel | undefined = registryFacade.currentUser()
    if (currentUser && !currentUser.preferences.selectedProfile) {
        router.navigateByUrl( AppRouteEnum.PREFERENCES_PROFILES ).then()
    }

    return currentUser?.preferences?.selectedProfile?.event?.options?.some( (option: SelectItem<string>): boolean => option.value === 'VEHICLE' ) ?? false
}
