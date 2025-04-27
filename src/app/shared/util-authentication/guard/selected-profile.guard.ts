import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AppConfig } from '../../../app.config'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { AppRouteEnum } from '../../../app-route.enum'

export const selectedProfileGuard: CanActivateFn = (): Promise<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )
    const router: Router = inject( Router )

    if (GenericUtil.isNull( registryFacade.selectedEvent() )) {
        registryFacade.notify( {
            severity: 'warn',
            summary: 'preferences.notifications.NO_SELECTED_PROFILE.title',
            detail: 'preferences.notifications.NO_SELECTED_PROFILE.message',
            closable: true,
            icon: 'pi pi-sort-alt-slash',
            life: AppConfig.config.notification.duration.warn,
        } )

        return router.navigateByUrl( AppRouteEnum.PREFERENCES_PROFILES ).then( () => false )
    }

    return true
}
