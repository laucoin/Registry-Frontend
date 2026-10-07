import { inject, Injectable, Injector } from '@angular/core'
import { ActionType, NgxsPlugin } from '@ngxs/store'
import { catchError, ObservableInput } from 'rxjs'
import { NgxsNextPluginFn } from '@ngxs/store/plugins'
import { ErrorModel } from '@shared/models/model/error.model'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { reportError } from '@shared/helpers/rx.helper'

@Injectable()
export class RegistryNgxsUnhandledErrorHandler implements NgxsPlugin {
    private registryFacade: RegistryFacade | undefined = undefined

    private readonly injector: Injector = inject( Injector )

    public handle (state: unknown, action: ActionType, next: NgxsNextPluginFn): void {
        return next( state, action ).pipe(
            catchError( (error: ErrorModel): ObservableInput<void> => {
                this.setRegistryFacadeIfNeeded()
                reportError( this.registryFacade!, error )
                throw error
            } ),
        )
    }

    private setRegistryFacadeIfNeeded (): void {
        if (this.registryFacade === undefined) {
            this.registryFacade = this.injector.get( RegistryFacade )
        }
    }
}
