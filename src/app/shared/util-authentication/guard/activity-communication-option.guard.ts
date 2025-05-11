import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'
import { map, Observable } from 'rxjs'
import { GenericUtil } from '../../util-tool/util/generic.util'

export const communicationOptionGuard: CanActivateFn = (): Promise<boolean> | Observable<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    if (GenericUtil.isNull( registryFacade.currentUser() )) {
        return registryFacade.currentUser$.pipe(
            map( (): boolean => hasCommunicationOption( registryFacade ) ),
        )
    }

    return hasCommunicationOption( registryFacade )
}

function hasCommunicationOption (registryFacade: RegistryFacade): boolean {
    return registryFacade.selectedProject()?.options?.some( (option: SelectItem<ProjectOptionEnum>): boolean => option.value === ProjectOptionEnum.COMMUNICATION ) ?? false
}
