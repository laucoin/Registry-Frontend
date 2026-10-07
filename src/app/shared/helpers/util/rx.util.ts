import { catchError, defer, finalize, Observable, throwError } from 'rxjs'
import { WritableSignal } from '@angular/core'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { ErrorModel } from '@shared/models/model/error.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

export const initialize = (onSubscribe: () => void) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    onSubscribe()
    return source
} )

export const withLoading = (loading: WritableSignal<boolean>) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    loading.set( true )
    return source.pipe( finalize( (): void => loading.set( false ) ) )
} )

export const reportError = (registryFacade: RegistryFacade, error: ErrorModel): void => {
    if (error.status === 503) {
        registryFacade.setGlobalError( error )
    } else {
        registryFacade.notify( {
            severity: SeverityEnum.ERROR,
            summary: error.title,
            detail: error.message,
            icon: 'pi pi-exclamation-triangle',
            closable: true,
            sticky: true,
        } )
    }
}

export const notifyOnError = (registryFacade: RegistryFacade) => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (error: ErrorModel): Observable<never> => {
        reportError( registryFacade, error )
        return throwError( (): ErrorModel => error )
    } ),
)
