import { inject } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';
import { signalStore, withMethods, withProps } from '@ngrx/signals';
import { Subject } from 'rxjs';

import { StringHelper } from '@shared/helpers/string.helper';
import { ConfirmationModel } from '@shared/models/model/confirmation.model';
import { NotificationModel } from '@shared/models/model/notification.model';

/**
 * Objectif: Relaie les notifications et les demandes de confirmation sous forme d'événements vers leurs composants d'affichage.
 * Périmètre: Possède un subject par type pour que chaque événement atteigne son écouteur, même plusieurs dans le même tick ; remplit les vides.
 * Limites: Ne détient aucun historique ; un écouteur tardif ne reçoit pas les messages passés.
 */
export const NotificationStore = signalStore(
	{ providedIn: 'root' },
	withProps(() => ({
		_messages: new Subject<NotificationModel>(),
		_confirmations: new Subject<ConfirmationModel>(),
	})),
	withMethods((store, translateService: TranslocoService = inject(TranslocoService)) => ({
		notify: (message: NotificationModel) => {
			const empty = StringHelper.isNullOrBlank(message.detail) && StringHelper.isNullOrBlank(message.summary);
			store._messages.next(
				empty
					? {
							...message,
							summary: translateService.translate('global.notifications.UNKNOWN_ERROR.title'),
							detail: translateService.translate('global.notifications.UNKNOWN_ERROR.message'),
						}
					: message,
			);
		},
		messages$: () => store._messages.asObservable(),
		confirm: (confirmation: ConfirmationModel) => store._confirmations.next(confirmation),
		confirmations$: () => store._confirmations.asObservable(),
	})),
);
