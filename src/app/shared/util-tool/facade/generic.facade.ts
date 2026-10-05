import { inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { Actions, Store } from '@ngxs/store'

export abstract class GenericFacade {
	protected readonly ngStore: Store = inject(Store)
	protected readonly actions$: Actions = inject(Actions)
	protected readonly translateService: TranslateService = inject(TranslateService)
}
