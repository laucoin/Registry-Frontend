import { Component, input, InputSignal } from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import { ErrorModel } from '@shared/models/model/error.model'
import { MessageModule } from 'primeng/message'

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
