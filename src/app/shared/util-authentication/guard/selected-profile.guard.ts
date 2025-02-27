import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AppConfig } from '../../../app.config'
import { AppRouteEnum } from '../../../app-route.enum'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { CurrentUserModel } from '../../util-model/model/current-user.model'

export const selectedProfileGuard: CanActivateFn = (): Promise<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )
    const router: Router = inject( Router )

    const currentUser: CurrentUserModel | undefined = registryFacade.currentUser()
    if (currentUser && !currentUser.preferences.selectedProfile) {
        registryFacade.notify( {
            severity: 'warn',
            summary: 'preferences.notifications.NO_SELECTED_PROFILE.title',
            detail: 'preferences.notifications.NO_SELECTED_PROFILE.message',
            closable: true,
            icon: 'pi pi-sort-alt-slash',
            life: AppConfig.config.notification.duration.warn,
        } )
        router.navigateByUrl( AppRouteEnum.PREFERENCES_PROFILES ).then()
    }

    return true
}
