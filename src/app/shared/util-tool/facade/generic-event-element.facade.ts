import { GenericFacade } from './generic.facade'
import { RegistryState } from '../../util-common/state/registry.state'

export abstract class GenericEventElementFacade extends GenericFacade {
    protected get actualSelectedEventId (): string | undefined {
        return this.ngStore.selectSnapshot( RegistryState.currentUserSelectedEventId )
    }
}
