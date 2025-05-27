import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { AppConfig } from '../../../app.config'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { map, Observable, tap } from 'rxjs'

export const selectedProfileGuard: CanActivateFn = (): Promise<boolean> | Observable<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    if (GenericUtil.isNull( registryFacade.currentUser() )) {
        return registryFacade.currentUser$.pipe(
            map( (): boolean => GenericUtil.isNull( registryFacade.selectedProject() ) ),
            tap( (hasSelectedProfile: boolean): void => {
                if (hasSelectedProfile) {
                    notifyNoProfile( registryFacade )
                }
            } ),
        )
    } else if (GenericUtil.isNull( registryFacade.selectedProject() )) {
        notifyNoProfile( registryFacade )
        return false
    }

    return true
}

function notifyNoProfile (registryFacade: RegistryFacade): void {
    registryFacade.notify( {
        severity: SeverityEnum.WARNING,
        summary: 'preferences.notifications.NO_SELECTED_PROFILE.title',
        detail: 'preferences.notifications.NO_SELECTED_PROFILE.message',
        closable: true,
        icon: 'pi pi-sort-alt-slash',
        life: AppConfig.settings.notification.duration.warn,
    } )
}
