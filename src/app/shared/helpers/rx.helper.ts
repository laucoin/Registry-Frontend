import { catchError, defer, EMPTY, finalize, Observable, ReplaySubject } from 'rxjs'
import { WritableSignal } from '@angular/core'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Contrat de ce que les stores et facades utilisent pour signaler un échec à l'utilisateur.
 * Scope: Propose le toast de notification.
 * Limits: Déclare uniquement la commande ; les implémentations vivent dans l'état de l'UI.
 */
export interface ErrorSink {
    notify (message: NotificationModel): void
}

/**
 * Purpose: Exécute un callback à chaque abonnement à la source.
 * Scope: Diffère l'abonnement pour que le callback s'exécute d'abord.
 * Limits: N'exécute rien quand la source se termine ; utiliser finalize pour cela.
 */
export const initialize = (onSubscribe: () => void) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    onSubscribe()
    return source
} )

/**
 * Purpose: Borne un drapeau de chargement à une source.
 * Scope: Lève le drapeau à l'abonnement et l'abaisse quand la source se termine, échoue ou est annulée.
 * Limits: Ne gère pas l'erreur ; la source échoue toujours.
 */
export const withLoading = (loading: WritableSignal<boolean>) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    loading.set( true )
    return source.pipe( finalize( (): void => loading.set( false ) ) )
} )

/**
 * Purpose: Affiche un échec à l'utilisateur.
 * Scope: Lève un toast d'erreur persistant.
 * Limits: N'arrête ni ne récupère le flux ; l'appelant le fait.
 */
export const reportError = (errorSink: ErrorSink, error: ErrorModel): void => {
    errorSink.notify( {
        severity: SeverityEnum.ERROR,
        summary: error.title ?? 'global.notifications.UNKNOWN_ERROR.title',
        detail: error.message,
        closable: true,
        sticky: true,
    } )
}

/**
 * Purpose: Signale une source en échec et la termine sans rien émettre.
 * Scope: Affiche un toast.
 * Limits: Ne réessaie pas.
 */
export const notifyOnError = (errorSink: ErrorSink) => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (error: ErrorModel): Observable<never> => {
        reportError( errorSink, error )
        return EMPTY
    } ),
)

/**
 * Purpose: Abandonne l'échec d'une source et la termine sans rien émettre.
 * Scope: Laisse un rafraîchissement en arrière-plan échouer sans toast ni état d'erreur.
 * Limits: Ne signale rien ; l'appelant réessaie selon son propre calendrier.
 */
export const ignoreError = () => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (): Observable<never> => EMPTY ),
)

/**
 * Purpose: Exécute une source immédiatement, comme une action dispatchée.
 * Scope: Rejoue l'issue aux appelants, qui peuvent l'ignorer ou s'y enchaîner.
 * Limits: N'annule pas la source quand les appelants se désabonnent.
 */
export const eager = <T> (source: Observable<T>): Observable<T> => {
    const result: ReplaySubject<T> = new ReplaySubject<T>()
    source.subscribe( result )
    return result.asObservable()
}
