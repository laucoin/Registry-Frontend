import { GenericFacade } from './generic.facade'
import { RegistryState } from '../../util-common/state/registry.state'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { inject, Signal } from '@angular/core'

export abstract class GenericEventElementFacade extends GenericFacade {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    public get selectedEventId (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserSelectedEventId )
    }
}
