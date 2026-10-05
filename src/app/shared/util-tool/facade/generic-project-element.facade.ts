import { inject, Signal } from '@angular/core'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { RegistryState } from '../../util-common/state/registry.state'
import { GenericFacade } from './generic.facade'

export abstract class GenericProjectElementFacade extends GenericFacade {
	protected readonly registryFacade: RegistryFacade = inject(RegistryFacade)

	public get selectedProjectId(): Signal<string | undefined> {
		return this.ngStore.selectSignal(RegistryState.currentUserSelectedProjectId)
	}
}
