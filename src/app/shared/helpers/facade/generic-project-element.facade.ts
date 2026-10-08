import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { inject, Signal } from '@angular/core'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CommandEvent, CommandEventService } from '@shared/helpers/facade/command-event.service'

export abstract class GenericProjectElementFacade extends GenericFacade {
    protected readonly uiFacade: UiFacade = inject( UiFacade )
    protected readonly sessionFacade: SessionFacade = inject( SessionFacade )
    protected readonly commandEvents: CommandEventService = inject( CommandEventService )

    public get selectedProjectId (): Signal<string | undefined> {
        return this.sessionFacade.currentProjectId
    }

    protected notifyMessage (
        severity: SeverityEnum,
        summary: string,
        detail: string,
        icon: string,
        data: object,
    ): void {
        this.uiFacade.notify( StateHelper.buildNotificationMessage( severity, summary, detail, icon, data ) )
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
        const key: string = command === 'update' ? 'edit' : command === 'status' ? 'edit-status' : command
        this.notifySuccess( `${ translationPrefix }.${ key }`, icon, data )
        this.commandEvents.emit( scope, command )
    }
}
