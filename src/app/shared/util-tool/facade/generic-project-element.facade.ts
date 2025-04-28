import { GenericFacade } from './generic.facade'
import { RegistryState } from '../../util-common/state/registry.state'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { inject, Signal } from '@angular/core'

export abstract class GenericProjectElementFacade extends GenericFacade {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    public get selectedProjectId (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )
    }
}
