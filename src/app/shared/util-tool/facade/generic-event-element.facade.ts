import { GenericFacade } from './generic.facade'
import { RegistryState } from '../../util-common/state/registry.state'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { inject } from '@angular/core'

export abstract class GenericEventElementFacade extends GenericFacade {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    protected get actualSelectedEventId (): string | undefined {
        return this.ngStore.selectSnapshot( RegistryState.currentUserSelectedEventId )
    }
}
