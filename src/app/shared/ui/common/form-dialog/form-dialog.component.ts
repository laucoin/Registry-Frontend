import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/dialog'
import '@sgdf/ui/icon'
import '@sgdf/ui/spinner'
import { UiFacade } from '@core/registry/state/ui.facade'
import { EventHelper } from '@shared/helpers/event.helper'
import { ErrorModel } from '@shared/models/model/error.model'
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component'

/**
 * Purpose: Dialog shell of a short create or edit form, opened by its own route over the list.
 * Scope: Shows the title, the load spinner, the submit error and the cancel and submit buttons; asks the page to submit or to close.
 * Limits: Owns no form model and never navigates; the page decides what submit and close do. A click outside never closes it, to keep the input.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-form-dialog',
	imports: [TranslocoPipe, FormErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-dialog.component.html',
})
export class FormDialogComponent {
	protected readonly uiFacade: UiFacade = inject(UiFacade)

	public readonly title: InputSignal<string | undefined> = input<string | undefined>()
	public readonly submitLabel: InputSignal<string> = input.required()
	public readonly submitIcon: InputSignal<string> = input<string>('pen-to-square')
	public readonly loading: InputSignal<boolean> = input<boolean>(false)
	public readonly saving: InputSignal<boolean> = input<boolean>(false)
	public readonly error: InputSignal<ErrorModel | undefined> = input<ErrorModel | undefined>()

	public readonly submitted: OutputEmitterRef<void> = output<void>()
	public readonly closed: OutputEmitterRef<void> = output<void>()

	protected hidden(event: Event): void {
		if (EventHelper.isFromHost(event)) this.closed.emit()
	}
}
