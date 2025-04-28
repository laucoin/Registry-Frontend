import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { AppConfig } from '../../../app.config'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'

export const selectedProfileGuard: CanActivateFn = (): Promise<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    if (GenericUtil.isNull( registryFacade.selectedProject() )) {
        registryFacade.notify( {
            severity: SeverityEnum.WARNING,
            summary: 'preferences.notifications.NO_SELECTED_PROFILE.title',
            detail: 'preferences.notifications.NO_SELECTED_PROFILE.message',
            closable: true,
            icon: 'pi pi-sort-alt-slash',
            life: AppConfig.config.notification.duration.warn,
        } )

        return false
    }

    return true
}
