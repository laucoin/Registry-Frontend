import { inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

export abstract class GenericFacade {
    protected readonly translateService: TranslateService = inject( TranslateService )
}
