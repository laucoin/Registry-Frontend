import { inject } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'

export abstract class GenericFacade {
    protected readonly translateService: TranslocoService = inject( TranslocoService )
}
