import { HttpErrorResponse } from '@angular/common/http'
import { StateContext } from '@ngxs/store'
import { Observable } from 'rxjs'
import { GenericState } from './generic.state'

export abstract class GenericProjectElementState<S> extends GenericState {
	protected abstract refreshPage(ctx: StateContext<S>, projectId: string | undefined): void

	protected abstract pageError(ctx: StateContext<S>, error: HttpErrorResponse): Observable<void>
}
