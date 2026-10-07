import { HttpErrorResponse } from '@angular/common/http'
import { StateContext } from '@ngxs/store'
import { GenericStore } from '@shared/helpers/state/generic.store'
import { Observable } from 'rxjs'

export abstract class GenericElementStore<S> extends GenericStore {
    protected abstract refreshPage (ctx: StateContext<S>): void

    protected abstract pageError (ctx: StateContext<S>, error: HttpErrorResponse): Observable<void>
}
