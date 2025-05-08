import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'

export const communicationOptionGuard: CanActivateFn = (): Promise<boolean> | boolean => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )

    return registryFacade.selectedProject()?.options?.some( (option: SelectItem<ProjectOptionEnum>): boolean => option.value === ProjectOptionEnum.COMMUNICATION ) ?? false
}
