import { inject } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'

/**
 * Purpose: Base des facades qui traduisent des libellés.
 * Scope: Fournit une traduction de libellés qui laisse l'option vide telle quelle.
 * Limits: Abstrait ; ne détient aucun état.
 */
export abstract class GenericFacade {
    private static readonly EMPTY_OPTION_LABEL: string = '-'

    protected readonly translateService: TranslocoService = inject( TranslocoService )

    protected translateLabel (label: string): string {
        return label === GenericFacade.EMPTY_OPTION_LABEL ? label : this.translateService.translate( label )
    }
}
