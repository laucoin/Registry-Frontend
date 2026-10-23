import { inject, Injectable } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Asks the user to confirm a command on a list element.
 * Scope: Builds the confirmation from the `<prefix>.title` and `<prefix>.message` translations of the element and hands it to the UI.
 * Limits: Does not run the command itself; the accept callback does.
 */
@Injectable({ providedIn: 'root' })
export class ElementConfirmationService {
    private readonly uiFacade: UiFacade = inject(UiFacade)
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public confirm(prefix: string, element: unknown, severity: SeverityEnum, icon: string, accept: () => void): void {
        this.uiFacade.confirm({
            header: this.translateService.translate(`${prefix}.title`, { element: element }),
            message: this.translateService.translate(`${prefix}.message`, { element: element }),
            icon: icon,
            acceptSeverity: severity,
            accept: accept,
        })
    }
}
