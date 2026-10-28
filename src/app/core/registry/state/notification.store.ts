import { inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { signalStore, withMethods, withProps } from '@ngrx/signals'
import { Observable, Subject } from 'rxjs'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Relaie les notifications et les demandes de confirmation sous forme d'événements vers leurs composants d'affichage.
 * Scope: Possède un subject par type pour que chaque événement atteigne son écouteur, même plusieurs dans le même tick ; abandonne les avis non autorisés et remplit les vides.
 * Limits: Ne détient aucun historique ; un écouteur tardif ne reçoit pas les messages passés.
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
