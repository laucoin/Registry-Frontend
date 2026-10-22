import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'

/**
 * Purpose: Cancel and submit buttons at the bottom of a form page.
 * Scope: Placed inside the `<form>`: the submit button submits it, so the Enter key of the fields does too; the cancel button asks the page to leave.
 * Limits: Owns no form state and never navigates.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-form-actions',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-actions.component.html',
})
export class FormActionsComponent {
	public readonly submitLabel: InputSignal<string> = input.required()
	public readonly submitIcon: InputSignal<string> = input<string>('pen-to-square')
	public readonly saving: InputSignal<boolean> = input<boolean>(false)

	public readonly cancelled: OutputEmitterRef<void> = output<void>()
}
