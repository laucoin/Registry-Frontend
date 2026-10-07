import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { map, Observable } from 'rxjs'
import { GenericUtil } from '@shared/helpers/util/generic.util'

export const alertOptionGuard: CanActivateFn = (): Promise<boolean> | Observable<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    if (GenericUtil.isNull( registryFacade.currentUser() )) {
        return registryFacade.currentUser$.pipe(
            map( (): boolean => hasAlertOption( registryFacade ) ),
        )
    }

    return hasAlertOption( registryFacade )
}

function hasAlertOption (registryFacade: RegistryFacade): boolean {
    return registryFacade.selectedProject()?.options?.some( (option: SelectItem<ProjectOptionEnum>): boolean => option.value === ProjectOptionEnum.ALERT ) ?? false
}
