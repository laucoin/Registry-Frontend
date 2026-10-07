import { StateContext } from '@ngxs/store'
import { GenericStore } from '@shared/helpers/state/generic.store'
import { HttpErrorResponse } from '@angular/common/http'
import { Observable } from 'rxjs'

export abstract class GenericProjectElementStore<S> extends GenericStore {
    protected abstract refreshPage (ctx: StateContext<S>, projectId: string | undefined): void

    protected abstract pageError (ctx: StateContext<S>, error: HttpErrorResponse): Observable<void>
}
