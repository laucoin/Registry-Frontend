import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { RegistryState } from '@core/registry/state/registry.state'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { inject, Signal } from '@angular/core'
import { StateUtil } from '@shared/helpers/state/state.util'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CommandEvent, CommandEventService } from '@shared/helpers/facade/command-event.service'

export abstract class GenericProjectElementFacade extends GenericFacade {
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    protected readonly commandEvents: CommandEventService = inject( CommandEventService )

    public get selectedProjectId (): Signal<string | undefined> {
        return this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )
    }

    protected notifyMessage (
        severity: SeverityEnum,
        summary: string,
        detail: string,
        icon: string,
        data: object,
    ): void {
        this.registryFacade.notify( StateUtil.buildNotificationMessage( severity, summary, detail, icon, data ) )
    }

    protected notifySuccess (translationPrefix: string, icon: string, data: object): void {
        this.notifyMessage(
            SeverityEnum.SUCCESS,
            `${ translationPrefix }.title`,
            `${ translationPrefix }.message`,
            icon,
            data,
        )
    }

    protected onCommandSucceeded (
        scope: string,
        command: CommandEvent,
        translationPrefix: string,
        icon: string,
        data: object,
    ): void {
        this.notifySuccess( `${ translationPrefix }.${ command === 'update' ? 'edit' : command }`, icon, data )
        this.commandEvents.emit( scope, command )
    }
}
