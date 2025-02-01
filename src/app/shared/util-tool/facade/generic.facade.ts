import { inject } from '@angular/core'
import { Actions, Store } from '@ngxs/store'

export abstract class GenericFacade {
    protected readonly ngStore: Store = inject( Store )
    protected readonly actions$: Actions = inject( Actions )
}
