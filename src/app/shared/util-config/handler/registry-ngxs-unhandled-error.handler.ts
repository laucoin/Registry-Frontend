import { inject, Injectable, Injector } from '@angular/core'
import { ActionType, NgxsPlugin } from '@ngxs/store'
import { catchError, ObservableInput } from 'rxjs'
import { NgxsNextPluginFn } from '@ngxs/store/plugins'
import { ErrorModel } from '../../util-model/model/error.model'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'

@Injectable()
export class RegistryNgxsUnhandledErrorHandler implements NgxsPlugin {
    private registryFacade: RegistryFacade | undefined = undefined

    private readonly injector: Injector = inject( Injector )

    public handle (state: unknown, action: ActionType, next: NgxsNextPluginFn): void {
        return next( state, action ).pipe(
            catchError( (error: ErrorModel): ObservableInput<void> => {
                this.setRegistryFacadeIfNeeded()
                if (error.status === 503) {
                    this.registryFacade?.setGlobalError( error )
                } else {
                    this.registryFacade!.notify( {
                        severity: SeverityEnum.ERROR,
                        summary: error.title,
                        detail: error.message,
                        icon: 'pi pi-exclamation-triangle',
                        closable: true,
                        sticky: true,
                    } )
                }
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
