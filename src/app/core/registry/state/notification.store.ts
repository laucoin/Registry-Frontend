import { signalStore, withMethods, withProps } from '@ngrx/signals'
import { Observable, Subject } from 'rxjs'
import { ToastMessageOptions } from 'primeng/api'

/**
 * Purpose: Relays notifications as events to the toast.
 * Scope: Owns a subject so that every message reaches the toast, even several in the same tick.
 * Limits: Holds no history; a late listener does not receive past messages.
 */
// Notifications are events, not state: every message must reach the toast, even several in the same tick.
export const NotificationStore = signalStore(
    { providedIn: 'root' },
    withProps( () => ({ messages: new Subject<ToastMessageOptions>() }) ),
    withMethods( (store) => ({
        notify: (message: ToastMessageOptions): void => store.messages.next( message ),
        messages$: (): Observable<ToastMessageOptions> => store.messages.asObservable(),
    }) ),
)
