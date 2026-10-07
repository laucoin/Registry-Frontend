import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { RegistryState } from '@core/registry/state/registry.state'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { inject, Signal } from '@angular/core'
import { StateUtil } from '@shared/helpers/state/state.util'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

export abstract class GenericProjectElementFacade extends GenericFacade {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    public get selectedProjectId (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )
    }

    protected notifySuccess (translationPrefix: string, icon: string, data: object): void {
        this.registryFacade.notify( StateUtil.buildNotificationMessage(
            SeverityEnum.SUCCESS,
            `${ translationPrefix }.title`,
            `${ translationPrefix }.message`,
            icon,
            data,
        ) )
    }
}
