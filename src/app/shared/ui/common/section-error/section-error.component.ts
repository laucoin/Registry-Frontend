import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import { NotificationModel } from '@shared/models/model/notification.model'

/**
 * Purpose: Shows the failure of one section of a page, with a retry action.
 * Scope: Renders the title and the backend message of the error in a danger callout and emits the retry request when the failure can be retried.
 * Limits: Owns no state and does not reload anything; the page decides what a retry does.
 */
@Component({
	selector: 'app-section-error',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './section-error.component.html',
})
export class SectionErrorComponent {
	public readonly error: InputSignal<NotificationModel> = input.required()
	public readonly retrying: InputSignal<boolean> = input(false)
	public readonly retryable: InputSignal<boolean> = input(true)

	public readonly retry: OutputEmitterRef<void> = output()
}
