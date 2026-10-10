import { inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { signalStore, withMethods, withProps } from '@ngrx/signals'
import { Observable, Subject } from 'rxjs'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Relays notifications and confirmation requests as events to their display components.
 * Scope: Owns one subject per kind so that every event reaches its listener, even several in the same tick; drops unauthorized notices and fills empty ones.
 * Limits: Holds no history; a late listener does not receive past messages.
 */
export const NotificationStore = signalStore(
    { providedIn: 'root' },
    withProps( () => ({ messages: new Subject<NotificationModel>(), confirmations: new Subject<ConfirmationModel>() }) ),
    withMethods( (store, translateService: TranslocoService = inject( TranslocoService )) => ({
        notify: (message: NotificationModel): void => {
            if (message.summary?.endsWith( '401' )) {
                return
            }
            const empty: boolean = StringHelper.isNullOrBlank( message.detail ) && StringHelper.isNullOrBlank( message.summary )
            store.messages.next( empty ? { ...message, summary: translateService.translate( 'global.notifications.UNKNOWN_ERROR.title' ), detail: translateService.translate( 'global.notifications.UNKNOWN_ERROR.message' ) } : message )
        },
        messages$: (): Observable<NotificationModel> => store.messages.asObservable(),
        confirm: (confirmation: ConfirmationModel): void => store.confirmations.next( confirmation ),
        confirmations$: (): Observable<ConfirmationModel> => store.confirmations.asObservable(),
    }) ),
)
