import { inject, Injectable } from '@angular/core'
import { NotificationModel } from '@shared/models/model/notification.model'
import { NotificationStore } from '@core/registry/state/notification.store'
import { UiStore } from '@core/registry/state/ui.store'
import { ErrorSink } from '@shared/helpers/rx.helper'
import { ErrorModel } from '@shared/models/model/error.model'

/**
 * Purpose: Lets stores report failures to the user without depending on a facade.
 * Scope: Forwards a global error to the UI store and a notification to the notification store.
 * Limits: Does not decide which failures are global; the rx helpers do.
 */
@Injectable( { providedIn: 'root' } )
export class ErrorReporter implements ErrorSink {
    private readonly ui: InstanceType<typeof UiStore> = inject( UiStore )
    private readonly notifications: InstanceType<typeof NotificationStore> = inject( NotificationStore )

    public setGlobalError (error: ErrorModel): void {
        this.ui.setGlobalError( error )
    }

    public notify (message: NotificationModel): void {
        this.notifications.notify( message )
    }
}
