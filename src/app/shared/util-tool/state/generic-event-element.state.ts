import { StateContext } from '@ngxs/store'
import { GenericState } from './generic.state'
import { HttpErrorResponse } from '@angular/common/http'
import { Observable } from 'rxjs'

export abstract class GenericEventElementState<S> extends GenericState {
    protected abstract refreshPage (ctx: StateContext<S>, eventId: string | undefined): void

    protected abstract pageError (ctx: StateContext<S>, error: HttpErrorResponse): Observable<void>
}
