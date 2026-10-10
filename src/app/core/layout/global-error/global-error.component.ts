import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal } from '@angular/core'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import { NotificationModel } from '@shared/models/model/notification.model'

/**
 * Purpose: Full-page error shown when the whole application is blocked.
 * Scope: Displays the error and its backend cause and offers a retry that reloads the application.
 * Limits: Does not decide when the application is blocked nor which error is shown; the UI facade does.
 */
@Component({
	selector: 'app-global-error',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './global-error.component.html',
	imports: [TranslocoPipe],
})
export class GlobalErrorComponent {
	private readonly uiFacade: UiFacade = inject(UiFacade)

	public readonly error: InputSignal<NotificationModel> = input.required<NotificationModel>()

	protected retry(): void {
		this.uiFacade.reloadApplication()
	}
}
