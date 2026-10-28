import { inject, Injectable } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Demande à l'utilisateur de confirmer une commande sur un élément de liste.
 * Scope: Construit la confirmation à partir des traductions `<prefix>.title` et `<prefix>.message` de l'élément et la remet à l'UI ; une confirmation avec saisie porte aussi la `<prefix>.phrase` que l'utilisateur doit saisir.
 * Limits: N'exécute pas la commande lui-même ; le callback d'acceptation le fait.
 */
@Injectable({ providedIn: 'root' })
export class ElementConfirmationService {
    private readonly uiFacade: UiFacade = inject(UiFacade)
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public confirm(prefix: string, element: unknown, severity: SeverityEnum, accept: () => void, typed: boolean = false): void {
        this.uiFacade.confirm({
            header: this.translateService.translate(`${prefix}.title`, { element: element }),
            message: this.translateService.translate(`${prefix}.message`, { element: element }),
            acceptSeverity: severity,
            accept: accept,
            ...(typed && { phrase: this.translateService.translate(`${prefix}.phrase`, { element: element }) }),
        })
    }
}
