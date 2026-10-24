import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { inject, Signal } from '@angular/core'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CommandEvent, CommandEventService } from '@shared/helpers/facade/command-event.service'

/**
 * Purpose: Base des facades des éléments de projet.
 * Scope: Fournit l'id du projet sélectionné, les facades UI et de session, et les notifications de succès des commandes.
 * Limits: Abstrait ; chaque facade de domaine possède son propre accès à l'état.
 */
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
        data: object,
    ): void {
        this.uiFacade.notify( StateHelper.buildNotificationMessage( severity, summary, detail, data ) )
    }

    protected notifySuccess (translationPrefix: string, data: object): void {
        this.notifyMessage(
            SeverityEnum.SUCCESS,
            `${ translationPrefix }.title`,
            `${ translationPrefix }.message`,
            data,
        )
    }

    protected onCommandSucceeded (
        scope: string,
        command: CommandEvent,
        translationPrefix: string,
        data: object,
    ): void {
        const key: string = command === 'update' ? 'edit' : command === 'status' ? 'edit-status' : command
        this.notifySuccess( `${ translationPrefix }.${ key }`, data )
        this.commandEvents.emit( scope, command )
    }
}
