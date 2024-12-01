import { inject } from '@angular/core'
import { Actions, Store } from '@ngxs/store'
import { Observable } from 'rxjs'
import { GenericModel } from '../../util-model/model/generic.model'
import { PageModel } from '../../util-model/model/page.model'
import { Message } from 'primeng/api'

export abstract class GenericFacade<M extends GenericModel> {
    protected readonly ngStore: Store = inject( Store )
    protected readonly actions$: Actions = inject( Actions )

    public abstract get page (): Observable<PageModel<M> | undefined>

    public abstract get pageLoading (): Observable<boolean>

    public abstract get pageSilentLoading (): Observable<boolean>

    public abstract get pageError (): Observable<Message | undefined>

    public abstract get element (): Observable<M | undefined>

    public abstract get elementLoading (): Observable<boolean>

    public abstract get elementError (): Observable<Message | undefined>
}
