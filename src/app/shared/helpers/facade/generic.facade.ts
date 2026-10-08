import { inject } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'

export abstract class GenericFacade {
    private static readonly EMPTY_OPTION_LABEL: string = '-'

    protected readonly translateService: TranslocoService = inject( TranslocoService )

    protected translateLabel (label: string): string {
        return label === GenericFacade.EMPTY_OPTION_LABEL ? label : this.translateService.translate( label )
    }
}
