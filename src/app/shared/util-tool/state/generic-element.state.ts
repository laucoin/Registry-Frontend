import { HttpErrorResponse } from '@angular/common/http'
import { StateContext } from '@ngxs/store'
import { GenericState } from './generic.state'
import { Observable } from 'rxjs'

export abstract class GenericElementState<S> extends GenericState {
    protected abstract refreshPage (ctx: StateContext<S>): void

    protected abstract pageError (ctx: StateContext<S>, error: HttpErrorResponse): Observable<void>

    protected abstract elementError (ctx: StateContext<S>, error: HttpErrorResponse): Observable<void>
}
