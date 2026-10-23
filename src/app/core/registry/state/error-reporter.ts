import { inject, Injectable } from '@angular/core'
import { NotificationModel } from '@shared/models/model/notification.model'
import { NotificationStore } from '@core/registry/state/notification.store'
import { ErrorSink } from '@shared/helpers/rx.helper'

/**
 * Purpose: Lets stores report failures to the user without depending on a facade.
 * Scope: Forwards a notification to the notification store.
 * Limits: Does not own the global error; the session does.
 */
@Injectable( { providedIn: 'root' } )
export class ErrorReporter implements ErrorSink {
    private readonly notifications: InstanceType<typeof NotificationStore> = inject( NotificationStore )

    public notify (message: NotificationModel): void {
        this.notifications.notify( message )
    }
}
