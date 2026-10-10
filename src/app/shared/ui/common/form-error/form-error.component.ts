import { Component, input, InputSignal } from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import { ErrorModel } from '@shared/models/model/error.model'
import { MessageModule } from 'primeng/message'

/**
 * Purpose: Displays the error of a whole form.
 * Scope: Shows the message the backend returned for the submit.
 * Limits: Field-level errors are shown by the field error component.
 */
@Component({
	selector: 'app-form-error',
	imports: [
		MessageModule,
		TranslocoPipe,
	],
	templateUrl: './form-error.component.html',
})
export class FormErrorComponent {
	public readonly error: InputSignal<ErrorModel | undefined> = input<ErrorModel | undefined>()
}
