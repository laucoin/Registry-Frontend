import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { RegistryState } from '@core/registry/state/registry.state'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { inject, Signal } from '@angular/core'

export abstract class GenericProjectElementFacade extends GenericFacade {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    public get selectedProjectId (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )
    }
}
