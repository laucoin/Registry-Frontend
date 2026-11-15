import { inject, Injectable } from '@angular/core';

import { NotificationStore } from '@core/registry/state/notification.store';
import { ErrorSink } from '@shared/helpers/rx.helper';
import { NotificationModel } from '@shared/models/model/notification.model';

/**
 * Objectif: Permet aux stores de signaler des échecs à l'utilisateur sans dépendre d'une facade.
 * Périmètre: Transmet une notification au store des notifications.
 * Limites: Ne possède pas l'erreur globale ; la session la possède.
 */
@Injectable({ providedIn: 'root' })
export class ErrorReporter implements ErrorSink {
	private readonly notifications: InstanceType<typeof NotificationStore> = inject(NotificationStore);

	public notify(message: NotificationModel): void {
		this.notifications.notify(message);
	}
}
