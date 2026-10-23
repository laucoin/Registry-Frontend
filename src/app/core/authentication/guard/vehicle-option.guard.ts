import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { map, Observable } from 'rxjs'

export const vehicleOptionGuard: CanActivateFn = (): Promise<boolean> | Observable<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    if (GenericHelper.isNull( registryFacade.currentUser() )) {
        return registryFacade.currentUser$.pipe(
            map( (): boolean => hasVehicleOption( registryFacade ) ),
        )
    }

    return hasVehicleOption( registryFacade )
}

function hasVehicleOption (registryFacade: RegistryFacade): boolean {
    return registryFacade.selectedProject()?.options?.some( (option: SelectItem<ProjectOptionEnum>): boolean => option.value === ProjectOptionEnum.VEHICLE ) ?? false
}
