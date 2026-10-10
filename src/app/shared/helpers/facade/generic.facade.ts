import { inject } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'

/**
 * Purpose: Base of the facades that translate labels.
 * Scope: Provides label translation that leaves the empty option as it is.
 * Limits: Abstract; holds no state.
 */
export abstract class GenericFacade {
    private static readonly EMPTY_OPTION_LABEL: string = '-'

    protected readonly translateService: TranslocoService = inject( TranslocoService )

    protected translateLabel (label: string): string {
        return label === GenericFacade.EMPTY_OPTION_LABEL ? label : this.translateService.translate( label )
    }
}
