import { inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { signalStore, withMethods, withProps } from '@ngrx/signals'
import { Observable, Subject } from 'rxjs'
import { ToastMessageOptions } from 'primeng/api'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Relays notifications as events to the toast.
 * Scope: Owns a subject so that every message reaches the toast, even several in the same tick; drops unauthorized notices and fills empty ones.
 * Limits: Holds no history; a late listener does not receive past messages.
 */
export const NotificationStore = signalStore(
    { providedIn: 'root' },
    withProps( () => ({ messages: new Subject<ToastMessageOptions>() }) ),
    withMethods( (store, translateService: TranslocoService = inject( TranslocoService )) => ({
        notify: (message: ToastMessageOptions): void => {
            if (message.summary?.endsWith( '401' )) {
                return
            }
            const empty: boolean = StringHelper.isNullOrBlank( message.detail ) && StringHelper.isNullOrBlank( message.summary )
            store.messages.next( empty ? { ...message, detail: translateService.translate( 'global.notifications.UNKNOWN_ERROR' ) } : message )
        },
        messages$: (): Observable<ToastMessageOptions> => store.messages.asObservable(),
    }) ),
)
